// OAuth 콜백 처리용 핸들러
// Dropbox OAuth 인증>액세스 토큰 가져옴>리프레시 토큰을 쿠키에 저징>/success 페이지로 리디렉션

import type { NextApiRequest, NextApiResponse } from 'next' // 요청, 응답 다룸
import nookies from 'nookies'
// 쿠키 쉽게 다루는 라이브러리
// 주요 기능
// parseCookies(요청 객체에서 쿠키 읽어오기),
// setCookie(새 쿠키 설정. 만료시간, 경로 옵션 지정 가능),
// destroyCookie(특정 쿠키 삭제)

import { mapToToken } from '@flow/reader/sync' // dropbox-refresh-token을 반환
// 왜 dropbox-refresh-token이 아니라 mapToToken 객체를 사용하는가?
// dropbox 이외의 다른 토큰도 해당 객체에 추가 할 수 있어 확장성이 좋고, 일관성있게 관리할 수 있음.

import { dbx } from '../utils' // dropbox API 클라이언트 인스턴스

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (
    typeof req.query.state !== 'string' ||
    typeof req.query.code !== 'string'
  ) {
    return res.status(400).end()
  } // state, code가 string이 아니면 400 에러 반환

  const state = JSON.parse(req.query.state) // state를 JSON으로 파싱해 객체로 변환

  const response = await dbx.auth.getAccessTokenFromCode(
    // 코드로부터 액세스 토큰을 가져옴
    state.redirectUri, // 리다이렉트 식별자
    req.query.code, // Dropbox에서 OAuth 인증 후 반환된 코드
  )
  const result = response.result as any // 결과 result에 저장

  nookies.set({ res }, mapToToken['dropbox'], result.refresh_token, {
    // Dropbox 리프레시 토큰을 쿠키에 저장
    maxAge: 365 * 24 * 60 * 60, // 쿠키 옵션 1년
    secure: true, // Https에서만 사용 가능
    path: '/',
  })

  // https://stackoverflow.com/questions/4694089/sending-browser-cookies-during-a-302-redirect
  // 302 리디렉션 중 쿠키가 정상적으로 설정되나? 에 대한 이야기
  // 쿠키의 SameSite 속성에 따라 동작이 달라질 수 있음.
  // SameSite=Strict: 동일 사이트 요청에서만 쿠키가 전송됨 → 리디렉션 후 요청에서는 쿠키가 전달되지 않을 수 있음.
  // SameSite=Lax: 안전한 HTTP 메서드(GET)에서만 크로스 사이트 요청 가능 → OAuth 등의 인증 과정에서 쿠키가 전달되지 않을 수 있음.
  // SameSite=None: 모든 요청에서 쿠키 전송 가능하지만 Secure 속성이 필요함 (HTTPS 필수).

  // 일부 브라우저는 Set-Cookie 헤더가 포함된 302 응답을 받은 후, 너무 빠르게 리디렉션을 수행하여 쿠키가 저장되기 전에 다음 요청을 실행하는 경우가 있음.
  // 302 리디렉션 대신 HTML meta refresh 또는 js 기반의 클라이언트 사이드 리디렉션을 활용하면 해결 가능.

  // OAuth 또는 로그인 후 리디렉션에서 쿠키가 사라지는 문제
  // 다른 도메인에서 리디렉션 되면서 브라우저가 SameSite=Strict로 설정된 쿠키를 차단하는 경우 발생
  // SameSite=None; Secure 설정해 크로스 사이트에서도 쿠키가 유지되도록 변경
  // 302 리디렉션 피하고, 200 응답 후 js로 이동 처리
  // meta refresh 방식으로 리디렉션
  res.redirect(302, '/success') // 302 리다이렉트 코드로 성공 페이지로 이동
}

// 추가로 고려할 점
// 쿠키 대신 NextAuth.js와 같은 다른 인증 라이브러리 사용 고려

// OAuth 인증을 더 편리하게 관리할 수 있음.

// 인증로직 직접 구현 불필요
// 지금 코드에서는 OAuth 요청을 수동으로 처리해야 함 (req.query.state, req.query.code 확인)
// Dropbox API와 직접 통신해야 함 (dbx.auth.getAccessTokenFromCode)
// 토큰을 쿠키에 저장해야 함 (nookies.set(...))
// 라이브러리를 사용하면 OAuth 인증을 위한 모든 흐름이 자동으로 처리됨
// OAuth 플로우가 자동화됨 → req.query.state와 req.query.code를 직접 다룰 필요 없음
// 토큰이 session을 통해 자동 관리됨 → nookies.set(...) 같은 작업이 필요 없음
// 프로바이더 추가가 쉬움 → Google, GitHub, Facebook 등 추가 가능

// API Route 없이도 인증 가능
// 현재는 /api/auth/[provider]를 통해 직접 API 요청을 받아야 함
// 클라이언트에서 인증하기 위해서는 /api/auth/dropbox 호출해야 함
// 라이브러리를 사용하면 자동으로 /api/auth/... 엔드포인트 제공, 클라에서 간단히 로그인 가능

// 세션 관리 자동화
// 현재는 쿠키 직접 설정하고 저장해야 함
// 클라이언트에서 쿠키를 읽어와야 하고, 토큰이 유효한지 직접 검증해야 함
// 라이브러리 사용시 useSession() 훅으로 자동세션관리 가능

// 다른 OAuth 추가하려면 로직을 직접구현해야 하지만 라이브러리를 사용하면 간단히 추가 가능
// 리프레시 토큰 자동 관리(jwt로 자동 갱신 가능)

// 쿠키로 관리하는 게 유리한 경우
// 인증 흐름을 원하는대로 커스텀 가능(토큰 저장 위치 자유롭게 설정 가능)
// 의존도 낮음
// 클라이언트-서버 간 인증방식을 더 유연하게 구성 가능
// 보안 설정을 세밀하게 조정 가능
// API 엔드포인트 더 세밀하게 분리 가능
