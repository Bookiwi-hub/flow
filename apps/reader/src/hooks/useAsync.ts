/**
 * @author 조현지
 * @description 비동기 작업을 처리하는 커스텀 훅
 * (현재 쓰이는 곳 없음)
 * @date 2025-03-17
 */

import { useEffect, useRef, useState } from 'react'

/**
 * 비동기 함수를 실행하고 그 결과를 상태로 관리하는 커스텀 훅이다.
 * @param func 실행할 비동기 함수이다.
 * @param deps 의존성 배열로, 이 값들이 변경될 때마다 비동기 함수를 다시 실행한다.
 * @returns 비동기 함수의 실행 결과값을 반환한다.
 */
export function useAsync<T>(
  func: () => Promise<T> | undefined | null,
  deps = [],
) {
  // 함수 참조를 유지하기 위한 ref를 생성한다.
  const ref = useRef(func)
  // 최신 함수를 ref에 항상 업데이트한다.
  ref.current = func
  // 비동기 함수의 결과값을 저장할 상태를 생성한다.
  const [value, setValue] = useState<T>()

  // 의존성 배열의 값이 변경될 때마다 비동기 함수를 실행한다.
  useEffect(() => {
    // ref.current()로 최신 함수를 호출하고, 반환된 Promise가 있으면
    // 그 결과값을 setValue를 통해 상태에 저장한다.
    ref.current()?.then(setValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // 비동기 함수의 최신 결과값을 반환한다.
  return value
}

/**
 * 이 훅은 비동기 함수(Promise를 반환하는 함수)를 인자로 받아 실행하고, 그 결과를 React 상태로 관리한다.
 * 의존성 배열이 변경될 때마다 비동기 함수를 다시 실행하여 상태를 업데이트한다.
 * 특히 useRef를 사용하여 항상 최신 함수 참조를 유지하는 패턴을 적용했다.
 * 이는 클로저 문제를 피하고 함수가 컴포넌트 리렌더링 사이에서도 항상 최신 상태를 참조할 수 있게 해준다.
 *
 * 다만 현재 프로젝트에서는 사용되고 있지 않음.
 */
