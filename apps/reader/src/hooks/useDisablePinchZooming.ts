/**
 * @author 조현지
 * @description 핀치 줌 기능을 비활성화하는 React 훅
 * @date 2025-03-21
 */

import { useEffect } from 'react'

// https://github.com/excalidraw/excalidraw/blob/7eaf47c9d41a33a6230d8c3a16b5087fc720dcfb/src/packages/excalidraw/index.tsx#L66
/**
 * iOS 기기에서 컨텐츠 영역 외부의 핀치 줌 동작을 방지하는 React 훅이다.
 * 웹 애플리케이션에서 사용자 정의 줌 컨트롤을 사용하거나 핀치 줌으로 인한
 * 의도치 않은 확대/축소를 방지하고자 할 때 유용하다.
 *
 * @param win - 이벤트 리스너를 추가할 Window 객체. 기본값은 전역 window 객체이다.
 */
export function useDisablePinchZooming(win?: Window) {
  useEffect(() => {
    const _win = win ?? window
    // 전달받은 window 객체가 있으면 사용하고, 없으면 기본 window 객체를 사용한다.

    // Block pinch-zooming on iOS outside of the content area
    const handleTouchMove = (event: TouchEvent) => {
      // 터치 이벤트를 처리하는 함수를 선언한다.

      event.preventDefault()
      // 기본 터치 이벤트 동작을 방지한다.
    }

    // 문서에 터치 이동 이벤트 리스너를 추가한다.
    // passive: false 옵션은 preventDefault()가 작동하도록 하기 위해 필요하다.
    // 최신 브라우저에서는 성능 향상을 위해 기본적으로 터치 이벤트를 passive로 처리한다.
    _win.document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    })

    return () => {
      _win.document.removeEventListener('touchmove', handleTouchMove)
      // 이벤트 리스너를 제거하여 메모리 누수를 방지한다.
    }
  }, [win])
}

/**
 * 이 훅은 iOS 기기에서 컨텐츠 영역 외부의 핀치 줌 기능을 비활성화하는 역할을 한다.
 * useEffect를 사용하여 컴포넌트가 마운트될 때 touchmove 이벤트 리스너를 추가하고, 언마운트될 때 이벤트 리스너를 제거한다.
 * 이 코드는 Excalidraw 라이브러리에서 참조되었다.
 */
