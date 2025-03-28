/**
 * @author ☯채종민
 * @description DropBox OAuth 인증 성공 후 표시되는 페이지
 * @date 2025-03-25
 */

import { useState, useEffect } from 'react'

import { OAUTH_SUCCESS_MESSAGE } from '../sync'

/**
 * OAuth 인증 성공 후 표시되는 페이지 컴포넌트
 * 인증 성공 메시지를 부모 창에 전달하고 3초 후 자동으로 창을 닫습니다.
 *
 * 동작 방식:
 * 1. 컴포넌트가 마운트되면 window.opener를 통해 부모 창에 성공 메시지를 전송
 * 2. 3초 카운트다운을 시작하고 화면에 표시
 * 3. 카운트다운이 끝나면 자동으로 창을 닫음
 *
 * 부모 창(settings.tsx)에서는 다음과 같이 메시지를 받습니다:
 * @example
 * useEventListener('message', (e) => {
 *   if (e.data === OAUTH_SUCCESS_MESSAGE) {
 *     window.location.reload() // 앱 초기화 및 새로고침
 *   }
 * })
 */
export default function Success() {
  // 3초 카운트다운을 위한 상태 관리
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // window.opener는 이 창을 연 부모 창을 참조합니다
    // OAuth 인증이 성공했음을 부모 창에 알립니다
    const opener: Window | null = window.opener
    opener?.postMessage(OAUTH_SUCCESS_MESSAGE)

    // 1초마다 실행되는 타이머 설정
    const id = setInterval(() => {
      setCountdown((cd) => {
        if (cd > 1) return cd - 1 // 카운트다운이 1초 이상 남았으면 1초 감소

        // 카운트다운이 0이 되면 타이머를 정리하고 창을 닫습니다
        clearInterval(id)
        window.close()
        return cd
      })
    }, 1000)
  }, []) // 컴포넌트 마운트 시 한 번만 실행

  // 성공 메시지와 카운트다운을 표시하는 UI
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div>
        <h1 className="typescale-headline-large text-green-600">
          Oauth success
        </h1>
        <p className="typescale-body-large text-on-surface-variant">
          This window will close in {countdown}s.
        </p>
      </div>
    </div>
  )
}
