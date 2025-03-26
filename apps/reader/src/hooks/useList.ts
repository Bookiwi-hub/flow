/**
 * @author 조현지
 * @description 가상화된 리스트를 관리하는 훅
 * @date 2025-03-25
 */

import useVirtual from 'react-cool-virtual'

import { scale } from '../platform'

/**
 * 리스트 아이템의 크기를 정의하는 상수다.
 *
 * scale 함수를 사용하여 플랫폼(모바일/데스크톱)에 따라 적절한 크기를 반환한다.
 * 이 상수는 가상화된 리스트의 각 아이템 높이를 일관되게 유지하기 위해 사용되며,
 * 다양한 화면 크기와 해상도에서 최적의 사용자 경험을 제공하기 위해 조정된다.
 */
export const LIST_ITEM_SIZE = scale(24, 32)

/**
 * 대용량 데이터를 효율적으로 렌더링하기 위한 가상화된 리스트 훅이다.
 *
 * 가상화(virtualization)는 긴 리스트에서 현재 화면에 보이는 요소만
 * 실제로 렌더링하고 나머지는 렌더링하지 않는 기술이다.
 * 이를 통해 수천 개의 아이템이 있는 리스트도 메모리와 성능에 부담 없이 부드럽게 스크롤할 수 있다.
 *
 * 이 훅은 react-cool-virtual 라이브러리를 활용하여 다음을 제공한다:
 * - 현재 뷰포트에 표시될 아이템만 계산
 * - 스크롤 위치 추적
 * - 아이템 높이 관리
 * - 효율적인 리스트 렌더링을 위한 메타데이터
 *
 * @param array - 가상화할 데이터 배열. 함수 내에서 변경되지 않도록 Readonly로 타입이 지정되었다.
 * @returns useVirtual 훅에서 제공하는 가상화 관련 속성과 메서드들
 *          (가시 범위 내 아이템, 참조 설정 함수, 스크롤 위치 등)
 *
 * @example
 * function BookList({ books }) {
 *   const { outerRef, innerRef, items } = useList(books);
 *
 *   return (
 *     <div ref={outerRef} style={{ height: "500px", overflow: "auto" }}>
 *       <div ref={innerRef}>
 *         {items.map(({ index, measureRef }) => (
 *           <div key={books[index].id} ref={measureRef}>
 *             {books[index].title}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useList(array: Readonly<any[]> = []) {
  // useVirtual 훅을 호출하여 가상 리스트 기능을 구현한다.
  // 제네릭 타입 매개변수로 HTMLDivElement를 지정하여 DOM 요소에 대한 참조 타입을 명확히 한다.
  return useVirtual<HTMLDivElement>({
    // 리스트의 전체 아이템 수를 배열의 길이로 설정한다.
    // 이 값은 가상 스크롤러가 총 스크롤 높이를 계산하는 데 사용된다.
    itemCount: array.length,

    // 각 아이템의 높이를 위에서 정의한 상수로 설정한다.
    // 고정 높이를 사용하면 가상화 계산이 더 효율적으로 수행된다.
    itemSize: LIST_ITEM_SIZE,
  })
}
