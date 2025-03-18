import type { NextApiRequest, NextApiResponse } from 'next' // Next.js API 라우트에서 요청(req)과 응답(res)을 다룰 때 사용.

import { mapToToken } from '@flow/reader/sync' // dropbox 키를 통해 Dropbox에 대한 토큰을 찾을 수 있음

import { dbx } from './utils' // Dropbox API 클라이언트 인스턴스

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Next.js API 라우트에서 실행되는 비동기 핸들러 함수.
  const token = req.cookies[mapToToken['dropbox']] // req.cookies에서 dropbox 키에 해당하는 값을 가져옴
  if (typeof token !== 'string') {
    return res.status(401).end()
  } // 만약 token이 문자열이 아니라면 401 에러 반환
  // 쿠키에서 Dropbox 리프레시 토큰을 찾는 과정

  dbx.auth.setRefreshToken(token) // Dropbox API 클라이언트에 리프레시 토큰 설정
  await dbx.auth.refreshAccessToken() // 액세스 토큰 갱신
  // 액세스 토큰 갱신 과정

  res.json({
    accessToken: dbx.auth.getAccessToken(), // 새로 발급된 액세스 토큰
    accessTokenExpiresAt: dbx.auth.getAccessTokenExpiresAt(), // 만료 시간
  })
}
