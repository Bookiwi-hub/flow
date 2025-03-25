/**
 * @author 조현지
 * @description 타이포그래피 설정을 관리하는 유틸리티 및 훅
 * @date 2025-03-25
 */

import { useMemo } from 'react'
import { useSnapshot } from 'valtio'

import { BookTab } from '../models'
import { useSettings } from '../state'

/**
 * 객체에서 undefined 값을 가진 속성을 제거하는 유틸리티 함수다.
 *
 * 이 함수는 주어진 객체를 순회하면서 값이 undefined가 아닌 속성만
 * 새로운 객체에 복사하여 반환한다. 이는 설정 객체를 병합할 때
 * undefined 값이 기본값을 덮어쓰지 않도록 방지하는 데 유용하다.
 *
 * 제네릭 타입 T를 사용하여 다양한 객체 타입에 적용할 수 있으며,
 * TypeScript의 Record 유틸리티 타입을 활용하여 객체 타입을 제한한다.
 *
 * @template T - 문자열 키를 가진 임의의 객체 타입
 * @param obj - undefined 속성을 제거할 원본 객체
 * @returns 원본 객체에서 undefined 값을 제외한 새로운 객체
 */
function removeUndefinedProperty<T extends Record<string, any>>(obj: T) {
  // 결과를 저장할 부분적인 객체를 초기화한다
  const newObj: Partial<T> = {}

  // 객체의 모든 키-값 쌍을 순회한다
  Object.entries(obj).forEach(([k, v]) => {
    // 값이 undefined가 아닌 경우에만 새 객체에 추가한다
    if (v !== undefined) {
      newObj[k as keyof T] = v
    }
  })

  return newObj
}

/**
 * 현재 탭의 책과 전역 설정에 기반한 타이포그래피 설정을 제공하는 훅이다.
 *
 * 이 훅은 Valtio의 상태 관리 시스템을 활용하여 책의 타이포그래피 구성과
 * 전역 설정을 결합한다. 책별 설정이 전역 설정보다 우선시되며,
 * undefined 값은 무시하여 기본값을 보존한다.
 *
 * useMemo를 사용하여 의존성이 변경될 때만 새로운 설정 객체를 계산함으로써
 * 불필요한 재계산을 방지하고 성능을 최적화한다.
 *
 * @param tab - 타이포그래피 설정을 가져올 BookTab 객체
 * @returns 전역 설정과 책별 설정이 병합된 최종 타이포그래피 설정 객체
 */
export function useTypography(tab: BookTab) {
  // Valtio의 useSnapshot 훅을 사용하여 탭에서 책 정보를 가져온다
  const { book } = useSnapshot(tab)
  // 전역 타이포그래피 설정을 가져온다
  const [settings] = useSettings()

  // 의존성이 변경될 때만 새로운 타이포그래피 설정을 계산한다
  return useMemo(
    () => ({
      // 먼저 전역 설정을 기본값으로 사용한다
      ...settings,
      // 그 다음 책의 타이포그래피 설정을 적용한다 (undefined 값 제외)
      ...removeUndefinedProperty(book.configuration?.typography ?? {}),
    }),
    // 책의 타이포그래피 설정이나 전역 설정이 변경될 때만 재계산한다
    [book.configuration?.typography, settings],
  )
}

/**
 * 첫째, removeUndefinedProperty 함수는 객체 정리를 위한 유틸리티 함수다. 
 * 이 함수는 객체에서 값이 undefined인 속성을 제거하여 설정 병합 과정에서 undefined 값이 유효한 기본값을 덮어쓰는 것을 방지한다. 이는 설정 시스템에서 매우 중요한 기능으로, 사용자가 특정 설정을 명시적으로 지정하지 않았을 때 기본값이 유지되도록 한다.

 * 둘째, useTypography 훅은 책 뷰어의 타이포그래피 설정을 관리한다. 
 * 이 훅은 다음과 같은 계층적 설정 시스템을 구현한다:
    전역 설정: 모든 책에 적용되는 기본 타이포그래피 설정이다.
    책별 설정: 특정 책에 대해 사용자가 지정한 커스텀 타이포그래피 설정이다.

이 훅은 이 두 설정 레이어를 병합하되, 책별 설정이 전역 설정보다 우선시되는 방식으로 작동한다. 
또한 useMemo를 통해 의존성(설정 또는 책 구성)이 변경될 때만 설정을 재계산하여 성능을 최적화한다.
이러한 접근 방식은 사용자에게 일관된 읽기 경험을 제공하면서도 개별 책에 대한 맞춤 설정의 유연성을 제공한다. 
예를 들어, 사용자는 전체 앱에서 기본 글꼴 크기를 설정하면서도 특정 책에 대해서는 더 큰 글꼴 크기를 지정할 수 있다.
 */
