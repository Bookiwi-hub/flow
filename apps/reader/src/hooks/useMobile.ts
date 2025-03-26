/**
 * @author 조현지
 * @description 모바일 환경 감지 훅
 * @date 2025-03-25
 */

import { useEffect } from 'react'
import { atom, useRecoilState } from 'recoil'

export const mobileState = atom<boolean | undefined>({
  // 모바일 상태를 저장할 Recoil atom을 선언한다.
  key: 'mobile',
  // atom의 고유 식별자를 'mobile'로 설정한다.
  default: undefined,
})

let listened = false
// 이벤트 리스너가 이미 등록되었는지 추적하는 전역 변수를 선언한다.

/**
 * 현재 기기가 모바일인지 감지하고 그 상태를 반환하는 커스텀 훅이다.
 *
 * @returns {boolean | undefined} 현재 기기의 모바일 상태 (true: 모바일, false: 데스크톱, undefined: 아직 감지되지 않음)
 */
export function useMobile() {
  const [mobile, setMobile] = useRecoilState(mobileState)
  // Recoil 상태를 가져오고 업데이트하는 함수를 얻는다.

  useEffect(() => {
    if (listened) return
    // 이미 리스너가 등록되어 있다면 중복 등록을 방지한다.

    listened = true
    // 리스너 등록 상태를 true로 설정한다.

    const mq = window.matchMedia('(max-width: 640px)')
    // 화면 너비가 640px 이하인지 확인하는 미디어 쿼리를 생성한다.

    setMobile(mq.matches)
    // 현재 미디어 쿼리 일치 여부로 모바일 상태를 설정한다.

    mq.addEventListener('change', (e) => {
      setMobile(e.matches)
      // 변경된 미디어 쿼리 일치 여부로 모바일 상태를 업데이트한다.
    })
  }, [setMobile])

  return mobile
}

/**
 * Recoil 상태 관리 라이브러리를 사용하여 모바일 상태를 전역적으로 관리하고, 미디어 쿼리를 통해 화면 너비가 640px 이하인 경우를 모바일로 간주한다.
 * 또한 화면 크기가 변경될 때 상태를 자동으로 업데이트하는 이벤트 리스너를 등록한다.
 * 특이한 점은 listened 변수를 사용하여 이벤트 리스너가 중복으로 등록되는 것을 방지한다는 것이다.

 * 이렇게 listened 변수를 사용하여 이벤트 리스너 중복 등록을 방지하는 방식에는 다음과 같은 장점이 있다:
    1. 성능 최적화: 여러 컴포넌트에서 useMobile 훅을 사용해도 이벤트 리스너는 단 한 번만 등록된다. 이는 메모리 사용량을 줄이고 성능을 향상시킨다.
    2. 전역 상태 일관성: 단일 이벤트 리스너가 Recoil 상태를 업데이트하므로, 애플리케이션 전체에서 모바일 상태 값이 항상 일관되게 유지된다.
    3. 리소스 낭비 방지: 미디어 쿼리 이벤트 리스너를 중복으로 등록하면 불필요한 콜백이 여러 번 실행될 수 있는데, 이를 방지한다.
    4. 메모리 누수 방지: 일반적으로 이벤트 리스너는 컴포넌트가 언마운트될 때 제거해야 하는데, 이 방식은 전역 상태로 관리하므로 개별 컴포넌트의 생명주기와 관계없이 일관되게 유지된다.
 */
