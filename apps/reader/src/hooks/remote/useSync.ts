/**
 * 책 데이터 원격 동기화를 처리하는 훅
 *
 * 이 훅은 현재 열린 책 탭(BookTab)의 데이터 변경을 감지하고,
 * 이를 자동으로 원격 저장소(Dropbox)에 동기화하는 기능을 제공
 * 드롭박스에 저장된 데이터와 클라이언트의 싱크를 맞추기 위한 훅
 *
 *  주요 사용 라이브러리와 기능
 *
 * 1. valtio - 프록시 기반 상태 관리 라이브러리
 *    - valtio는 JavaScript의 Proxy API를 사용하여 상태 객체의 변경을 감지
 *
 *    ▶ 프록시 객체란?
 *      - JavaScript의 Proxy 객체는 다른 객체(원본 객체)에 대한 중간자 역할을 합니다.
 *      - 프록시는 원본 객체에 대한 기본 작업(속성 읽기, 쓰기, 삭제 등)을 가로채고
 *        사용자 정의 동작을 추가할 수 있게 해줌줌.
 *      - valtio는 이 프록시를 사용해 객체 변경을 감지하고 필요할때 화면에 반영을 시켜줌줌.
 *      - 예: proxy({ count: 0 })는 { count: 0 } 객체를 프록시로 감싸 변경 감지 가능하게 함
 *
 *    ▶ 원본 객체와 프록시 객체의 관계
 *      - 원본 객체: 실제 데이터를 담고 있는 일반 JavaScript 객체 (예: BookTab 인스턴스)
 *      - 프록시 객체: 원본 객체를 감싸는 특별한 객체로, 속성 접근과 수정을 감시함
 *      - 프록시 객체는 원본 객체에 대한 참조를 유지하며, 깊은 복사를 사용하지 않음
 *        (찾아 봤을때 원본 객체의 상태를 참조 한다고 되어있어서 깊은 복사인줄 알았는데 깊은 복사는 아니고
 *         원본 객체의 상태를 참조해서 다른 복사본을 만들어서 사용하는 방식으로 보임)
 *      - 대신 속성이 변경될 때마다 해당 변경을 추적하는 방식으로 동작함
 *        (원본 객체가 변경되면 해당 부분만 새로운 스냅샷으로 업데이트됨)
 *
 *    ▶ useSnapshot의 역할
 *      - useSnapshot은 프록시 객체의 현재 상태를 읽기 전용 스냅샷으로 반환합니다.
 *      - 이 스냅샷은 깊은 복사가 아니라 원본 객체의 현재 상태를 참조하는 방식으로 생성됨
 *      - 성능을 위해 실제로는 필요한 속성에 대해서만 프록시를 생성함
 *      - 원본 객체가 변경되면 해당 부분만 새로운 스냅샷으로 업데이트됨

 *
 *    ▶ 다른 상태 관리 방식과 비교
 *      - React의 useState: 상태 업데이트 시 새 객체를 만들어야 함 (setState({ ...state, count: state.count + 1 }))
 *      - Immer: 원본처럼 직접 수정 가능하지만 불변성을 보장하기 위해 내부적으로 깊은 복사 사용
 *      - valtio: 원본처럼 직접 수정 가능하고(tab.book.percentage = 0.5), 깊은 복사 없이 변경 감지 가능
 *
 * 2. SWR의 mutate 함수 - 원격 데이터 갱신
 *    - useRemoteBooks 훅에서 제공하는 mutate 함수를 사용하여
 *      원격 데이터를 업데이트합니다.
 *    - 작동 원리
 *      1) 로컬 캐시를 즉시 업데이트하여 UI에 반영 (낙관적 업데이트)
 *      2) 콜백 함수를 통해 원격 데이터를 수정하고 원격 저장소에 반영
 *      3) revalidate 옵션을 false로 설정하여 불필요한 재요청 방지
 *
 * ■ 동기화되는 데이터(드롭박스에 있는 데이터와 동기되는 데이터)
 *
 * 1. 읽기 위치(cfi)와 진행률(percentage)
 *    → 다른 기기에서 동일한 위치에서 계속 읽기 가능
 *
 * 2. 사용자 정의 용어(definitions)
 *    → 용어 정의가 모든 기기에서 동일하게 유지됨
 *
 * 3. 주석(annotations)
 *    → 하이라이트, 노트 등이 모든 기기에서 볼 수 있음
 *
 * 4. 책 설정(configuration)
 *    → 폰트, 테마, 여백 등 읽기 환경 설정 동기화
 *
 * ■ 사용 예시:
 *
 * ```tsx
 * // BookPane 컴포넌트에서:
 * function BookPane({ tab }) {
 *   // 자동으로 책 데이터 동기화 설정
 *   useSync(tab);
 *
 *   // 컴포넌트 렌더링...
 * }
 * ```
 *
 * ■ 주요 사용처:
 * - 'apps/reader/src/components/Reader.tsx'의 BookPane 컴포넌트
 *   → 책을 읽는 동안 자동으로 데이터 동기화
 */

import { useCallback, useEffect } from 'react'
import { useSnapshot } from 'valtio'

import { Annotation } from '@flow/reader/annotation'
import { BookRecord } from '@flow/reader/db'
import { BookTab } from '@flow/reader/models'
import { uploadData } from '@flow/reader/sync'

import { useRemoteBooks } from './useRemote'

/**
 * 책 데이터를 원격 스토리지와 동기화하는 훅
 *
 * @param tab - 동기화할 책 탭 인스턴스 (BookTab)
 *
 * 이 훅은 valtio의 useSnapshot과 SWR의 mutate를 사용하여
 * 책 상태 변경을 감지하고 원격 저장소에 동기화합니다.
 */
export function useSync(tab: BookTab) {
  // useRemoteBooks 훅에서 mutate 함수 가져오기
  // 기본적으로 드롭박스에 저장된 책 데이터를 가져오는 훅
  const { mutate } = useRemoteBooks()

  /**
   * valtio의 useSnapshot을 사용하여 tab 객체의 상태 변화를 구독
   *
   * useSnapshot은 valtio의 핵심 React 훅으로, 프록시 객체(tab)의
   * 현재 상태를 읽기 전용 스냅샷으로 제공합니다.
   *
   * ▶ useSnapshot의 동작 원리
   *   1. tab 객체는 valtio의 proxy() 함수로 생성된 프록시 객체입니다.
   *      - reader.tsx에서 tab = new BookTab(...)으로 생성 후
   *      - proxy(tab)로 프록시 객체로 변환됨 (models/reader.ts 파일 참조)
   *
   *   2. 프록시 객체는 속성 접근과 수정을 가로채는 특별한 객체입니다.
   *      - 예: tab.book.percentage = 0.5와 같이 직접 수정해도 변경이 추적됨
   *
   *   3. useSnapshot(tab)의 작동 방식
   *      - 깊은 복사(deep clone)를 사용하지 않음 - 성능상의 이점
   *      - 대신 프록시 객체에 대한 "스냅샷 뷰"를 생성
   *      - 이 스냅샷은 원본 객체 구조를 보존하지만 읽기 전용임
   *      - 실제로 사용되는 속성에 대해서만 프록시를 생성하여 성능 최적화
   *
   *   4. 변경 감지 메커니즘
   *      - 프록시 객체의 속성이 변경되면 내부적으로 구독 시스템이 활성화됨
   *      - 해당 속성을 사용하는 컴포넌트에만 선택적으로 리렌더링을 트리거함
   *      - 변경되지 않은 부분은 재렌더링되지 않아 성능이 최적화됨
   *
   * 여기서는 다음 두 가지 주요 상태를 구독합니다:
   * - location: 현재 읽기 위치 정보 (cfi, href, 페이지 등)
   * - book: 책 메타데이터와 상태 (주석, 정의, 설정 등)
   */
  const { location, book } = useSnapshot(tab)

  const id = tab.book.id

  /**
   * 변경된 책 데이터를 원격 저장소에 동기화하는 함수
   *
   * 이 함수는 SWR의 mutate를 사용하여 원격 데이터를 업데이트합니다.
   *
   * 동작 과정:
   * 1. mutate 함수를 호출하고 콜백 함수를 전달
   * 2. 콜백 함수는 현재 remoteBooks 배열에서 해당 책을 찾음
   * 3. 찾은 책 데이터에 변경 사항(changes)을 적용
   * 4. uploadData 함수를 호출하여 Dropbox에 업데이트된 데이터 저장
   * 5. 업데이트된 배열을 반환하여 로컬 캐시 갱신
   *
   * revalidate: false 옵션은 mutate 후 SWR이 서버에 재검증 요청을
   * 보내지 않도록 하여 성능을 최적화합니다.
   */
  const sync = useCallback(
    async (changes: Partial<BookRecord>) => {
      // remoteBooks 의존성 제거를 위해 mutate 콜백 내에서 처리
      mutate(
        (remoteBooks) => {
          if (remoteBooks) {
            const i = remoteBooks.findIndex((b) => b.id === id)
            if (i < 0) return remoteBooks

            // 해당 책 데이터 업데이트
            remoteBooks[i] = {
              ...remoteBooks[i]!,
              ...changes,
            }

            // Dropbox에 데이터 업로드
            uploadData(remoteBooks)

            // 업데이트된 배열 반환 (로컬 캐시 갱신)
            return [...remoteBooks]
          }
        },
        { revalidate: false },
      )
    },
    [id, mutate],
  )

  /**
   * 읽기 위치 및 진행률 동기화
   *
   * 사용자가 페이지를 넘기거나 특정 위치로 이동할 때마다
   * 현재 위치(cfi)와 전체 진행률(percentage)을 동기화합니다.
   * 이를 통해 다른 기기에서도 동일한 위치에서 계속 읽을 수 있습니다.
   */
  useEffect(() => {
    sync({
      cfi: location?.start.cfi,
      percentage: book.percentage,
    })
  }, [sync, book.percentage, location?.start.cfi])

  /**
   * 사용자 정의 용어 동기화
   *
   * 사용자가 새로운 용어를 정의하거나 기존 정의를 삭제할 때
   * definitions 배열을 동기화합니다.
   * 이를 통해 모든 기기에서 동일한 용어 정의를 볼 수 있습니다.
   */
  useEffect(() => {
    sync({
      definitions: book.definitions as string[],
    })
  }, [book.definitions, sync])

  /**
   * 주석 동기화
   *
   * 사용자가 하이라이트, 노트 등을 추가, 수정, 삭제할 때
   * annotations 배열을 동기화합니다.
   * 이를 통해 모든 기기에서 동일한 주석을 볼 수 있습니다.
   */
  useEffect(() => {
    sync({
      annotations: book.annotations as Annotation[],
    })
  }, [book.annotations, sync])

  /**
   * 책 설정 동기화
   *
   * 사용자가 폰트, 테마, 여백 등의 설정을 변경할 때
   * configuration 객체를 동기화합니다.
   * 이를 통해 모든 기기에서 동일한 읽기 환경을 유지할 수 있습니다.
   */
  useEffect(() => {
    sync({
      configuration: book.configuration,
    })
  }, [book.configuration, sync])
}
