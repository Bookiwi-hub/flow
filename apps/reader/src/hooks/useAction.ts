/**
 * @author 조현지
 * @description Recoil을 사용한 액션 상태 관리 모듈
 * @date 2025-03-25
 */

import { atom, useRecoilState, useSetRecoilState } from 'recoil'

/**
 * 애플리케이션에서 사용되는 액션 타입을 정의한다.
 * 각 액션은 UI에서 활성화될 수 있는 특정 기능이나 패널을 나타낸다.
 *
 * 'toc' - 목차 패널을 표시하는 액션
 * 'search' - 검색 기능을 활성화하는 액션
 * 'annotation' - 주석 기능을 활성화하는 액션
 * 'typography' - 텍스트 스타일 설정 패널을 표시하는 액션
 * 'image' - 이미지 관련 기능을 활성화하는 액션
 * 'timeline' - 타임라인 뷰를 활성화하는 액션
 * 'theme' - 테마 설정 패널을 표시하는 액션
 */
export type Action =
  | 'toc' // 목차
  | 'search' // 검색
  | 'annotation' // 주석
  | 'typography' // 타이포그래피
  | 'image' // 이미지
  | 'timeline' // 타임라인
  | 'theme' // 테마

/**
 * 현재 활성화된 액션을 추적하는 Recoil 상태 원자다.
 * 액션이 활성화되지 않았을 때는 undefined 값을 가진다.
 *
 * key: Recoil의 내부 식별자로 사용되는 고유 문자열
 * default: 초기 상태 값, 기본적으로 활성화된 액션이 없으므로 undefined
 */
export const actionState = atom<Action | undefined>({
  key: 'action', // Recoil 내부에서 상태를 식별하는 고유 키
  default: undefined, // 초기값은 활성화된 액션 없음
})

/**
 * 액션 상태만 설정하는 함수를 반환하는 커스텀 훅이다.
 *
 * 이 훅을 사용하면 컴포넌트에서 액션 상태의 값을 읽지 않고
 * 오직 값을 변경하는 함수만 가져올 수 있다.
 * 이는 불필요한 리렌더링을 방지하는 데 도움이 된다.
 *
 * @returns 액션 상태를 변경하는 함수
 */
export function useSetAction() {
  return useSetRecoilState(actionState)
}

/**
 * 액션 상태의 값과 이를 변경하는 함수를 함께 반환하는 커스텀 훅이다.
 *
 * 이 훅은 액션의 현재 값을 읽고 변경해야 하는 컴포넌트에서 사용된다.
 *
 * @returns [현재 액션 상태, 액션 상태를 변경하는 함수] 형태의 튜플
 */
export function useAction() {
  return useRecoilState(actionState)
}

/**
 * 이 코드는 Recoil 상태 관리 라이브러리를 사용하여 애플리케이션의 액션 상태를 관리하는 모듈이다.
 * 여기서 말하는 '액션'은 사용자 인터페이스에서 활성화할 수 있는 다양한 기능이나 패널(목차, 검색, 주석 등)을 의미한다.

 *언뜻 보기에는 useAction과 직접 useRecoilState(actionState)를 사용하는 것 사이에 큰 차이가 없어 보일 수 있다. 
  그러나 이러한 커스텀 훅을 만드는 데에는 몇 가지 중요한 이유가 있다:

    1. 추상화 레이어 제공:
    커스텀 훅은 Recoil의 구현 세부 사항을 숨기는 추상화 레이어를 만든다. 
    컴포넌트는 Recoil API를 직접 사용하는 대신 useAction과 같은 의미 있는 이름의 훅을 사용할 수 있다.
    이런 추상화는 나중에 상태 관리 라이브러리를 다른 것으로 변경해야 할 경우(예: Recoil에서 Redux로) 모든 컴포넌트를 수정하지 않고 이 모듈만 변경하면 된다는 장점이 있다.

    2. 관심사 분리:
    useSetAction은 액션 상태를 변경만 하고 싶은 컴포넌트를 위한 것이다. 
    이 컴포넌트들은 상태 값에 의존하지 않고 변경 함수만 필요하다.
    useAction은 액션 상태의 현재 값을 읽고 변경해야 하는 컴포넌트를 위한 것이다.

    3. 성능 최적화:
    useSetAction을 사용하는 컴포넌트는 액션 상태가 변경되어도 리렌더링되지 않는다. 
    반면 useRecoilState나 useAction을 사용하는 컴포넌트는 액션 상태가 변경될 때마다 리렌더링된다.
    이는 큰 애플리케이션에서 불필요한 리렌더링을 줄이는 데 중요한 최적화 방법이다.

    4. 유지보수성 및 가독성 향상:
    의미 있는 이름의 커스텀 훅은 코드의 의도를 명확하게 전달한다. 
    useAction()는 "이 컴포넌트는 액션 상태에 관심이 있다"는 것을 즉시 알 수 있게 해준다.
    이는 특히 대규모 팀이나 장기 프로젝트에서 코드를 더 이해하기 쉽게 만든다.

    5. 확장성:
    나중에 액션 관련 로직을 추가해야 할 경우, 이러한 커스텀 훅 내부에 로직을 추가할 수 있다. 
    예를 들어, 액션이 변경될 때 로깅을 추가하거나, 특정 조건에서만 액션을 변경할 수 있게 하는 등의 기능을 쉽게 구현할 수 있다.
 */
