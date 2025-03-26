/**
 * @author 조현지
 * @description 책 라이브러리 데이터를 실시간으로 가져오는 훅
 * @date 2025-03-25
 */

import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../db'

/**
 * 사용자의 책 라이브러리 데이터를 실시간으로 가져오는 React 커스텀 훅이다.
 *
 * 이 훅은 Dexie.js의 useLiveQuery를 활용하여 IndexedDB에 저장된 책 데이터를 반응적으로 조회한다.
 * IndexedDB는 브라우저에 내장된 클라이언트 측 저장소로, 대용량 구조화된 데이터를 효율적으로 저장하고 검색할 수 있다.
 *
 * useLiveQuery는 일반 쿼리와 달리 데이터베이스의 변경사항을 지속적으로 관찰하고
 * 변경이 감지되면 자동으로 쿼리를 다시 실행하여 최신 데이터를 제공한다.
 * 이를 통해 다른 탭이나 컴포넌트에서 데이터가 변경되더라도 UI가 자동으로 최신 상태로 유지된다.
 *
 * @returns {Array} 사용자의 책 컬렉션 배열. 데이터베이스가 초기화되지 않았거나
 *                  오류가 발생한 경우 빈 배열을 반환한다.
 *
 * @example
 * function BookshelfComponent() {
 *   const books = useLibrary();
 *
 *   return (
 *     <div>
 *       <h1>내 서재</h1>
 *       <ul>
 *         {books.map(book => (
 *           <li key={book.id}>{book.title}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 */
export function useLibrary() {
  // useLiveQuery를 사용하여 데이터베이스의 books 컬렉션에서 모든 책을 가져온다.
  // 이 쿼리는 데이터베이스가 변경될 때마다 자동으로 다시 실행된다.
  return useLiveQuery(() => db?.books.toArray() ?? [])
}
