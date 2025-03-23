# IndexedDB와 Dexie.js

## 1. IndexedDB란?

### 1.1 IndexedDB 개요

IndexedDB는 브라우저 내에서 대량의 구조화된 데이터를 저장할 수 있는 비동기 방식의 NoSQL 데이터베이스입니다. 웹 애플리케이션이 클라이언트 측에서 데이터를 저장하고 오프라인 환경에서도 동작할 수 있도록 지원합니다. 주로 오프라인 작업이 필요한 웹 애플리케이션이나 Progressive Web Apps(PWA)에서 사용되며, 파일, 블롭(blob), 객체 등 다양한 데이터 형식을 지원합니다.

### 1.2 IndexedDB의 주요 특징

- **비동기 API**: IndexedDB는 비동기 방식으로 데이터를 처리하여 UI가 멈추는 것을 방지합니다.
- **객체 저장 지원**: 단순한 key-value 저장 방식뿐만 아니라 구조화된 객체 저장을 지원합니다.
- **트랜잭션 기반**: 데이터 일관성을 보장하기 위해 트랜잭션을 제공합니다.
- **인덱싱 지원**: 검색 성능을 최적화하기 위해 인덱스를 활용할 수 있습니다.
- **도메인 별 저장소**: 웹사이트마다 독립적인 데이터 저장소를 제공합니다.

---

## 2. IndexedDB의 기본 사용법

IndexedDB를 기본 API로 사용하려면 다소 복잡한 설정이 필요합니다.

```javascript
// IndexedDB 데이터베이스 열기 (이름: 'MyDatabase', 버전: 1)
const request = indexedDB.open('MyDatabase', 1)

// 데이터베이스가 처음 생성되거나 버전이 변경될 때 실행됨
request.onupgradeneeded = (event) => {
  const db = event.target.result
  // 'books'라는 오브젝트 스토어(테이블) 생성, 'id'를 키 값으로 설정
  db.createObjectStore('books', { keyPath: 'id' })
}

// 데이터베이스가 성공적으로 열렸을 때 실행됨
request.onsuccess = (event) => {
  const db = event.target.result
  console.log('Database opened successfully', db)
}

// 데이터베이스를 여는 과정에서 오류가 발생했을 때 실행됨
request.onerror = (event) => {
  console.error('Database error:', event.target.error)
}
```

이처럼 IndexedDB의 기본 API는 설정이 다소 복잡하고, Promise가 아닌 이벤트 기반 콜백을 사용하기 때문에 사용하기 까다로운 면이 있습니다. 이를 해결하기 위해 등장한 라이브러리가 **Dexie.js**입니다.

---

## 3. Dexie.js란?

### 3.1 Dexie.js 개요

[Dexie.js](https://dexie.org/)는 IndexedDB를 보다 쉽게 사용할 수 있도록 도와주는 경량 라이브러리입니다. IndexedDB의 복잡한 콜백 구조를 **Promise 및 async/await** 기반으로 개선하고, 간결한 문법으로 데이터 관리를 용이하게 합니다.

### 3.2 Dexie의 주요 장점

- **간결한 API**: 선언적 방식으로 테이블을 정의하고 데이터를 관리할 수 있습니다.
- **Promise 기반**: IndexedDB의 콜백 스타일을 Promise와 async/await 방식으로 개선합니다.
- **자동 마이그레이션**: 데이터베이스 구조 변경 시 업그레이드 로직을 쉽게 추가할 수 있습니다.
- **강력한 쿼리 기능**: `where`, `filter`, `orderBy` 등으로 데이터를 효율적으로 검색할 수 있습니다.

---

## 4. Dexie.js 활용 예제

아래 예제에서는 EPUB 파일을 저장하고, 책의 메타데이터를 관리하는 데이터베이스를 Dexie.js를 사용하여 구현합니다.

### 📌 `db.ts` 파일: Dexie를 활용한 데이터베이스 클래스 정의

```typescript
import Dexie, { Table } from 'dexie'

// 📌 책 정보 저장을 위한 인터페이스 정의 (버전 2에서 author 필드 추가)
export interface BookRecord {
  id: string
  name: string
  createdAt: number
  author?: string // 버전 2에서 추가된 필드
}

// 📌 Dexie를 확장한 데이터베이스 클래스 정의
export class DB extends Dexie {
  books!: Table<BookRecord>

  constructor(name: string) {
    super(name)

    // 버전 2: author 필드 추가
    this.version(2)
      .stores({
        books: 'id, name, createdAt, author',
      })
      .upgrade(async (t) => {
        // 기존 데이터를 변경하여 author 필드를 추가 (기본값: "Unknown")
        await t
          .table('books')
          .toCollection()
          .modify((book) => {
            book.author = 'Unknown'
          })
      })

    // 버전 1: books 테이블 최초 생성
    this.version(1).stores({
      books: 'id, name, createdAt',
    })
  }
}

// 📌 데이터베이스 인스턴스 생성
export const db = new DB('epub-reader')
```

## 5. 버전으로 관리하는 이유

버전을 추가하는 이유는 기존 데이터를 손실 없이 유지하면서, 새 기능을 추가할 수 있도록 하기 위함입니다. 기존 사용자들이 버전 1을 사용하고 있었다면, 앱 업데이트 시 기존 데이터를 유지하면서 버전 2로 자동 마이그레이션됩니다.

## 6. Dexie.js 활용한 CRUD 예제

### 6.1 데이터 추가

```typescript
async function addBook(book: BookRecord) {
  await db.books.add(book)
}
```

### 6.2 데이터 조회

```typescript
async function getBook(id: string) {
  return await db.books.get(id)
}
```

### 6.3 데이터 수정

```typescript
async function updateBook(id: string, updates: Partial<BookRecord>) {
  await db.books.update(id, updates)
}
```

### 6.4 데이터 삭제

```typescript
async function deleteBook(id: string) {
  await db.books.delete(id)
}
```

---

## 7. IndexedDB vs Dexie.js 비교

| 기능        | IndexedDB 기본 API                | Dexie.js                         |
| ----------- | --------------------------------- | -------------------------------- |
| 사용법      | 콜백 기반 API로 복잡              | Promise 및 async/await 지원      |
| 데이터 저장 | 개별적인 트랜잭션 처리 필요       | 자동 트랜잭션 처리               |
| 인덱싱      | 수동으로 관리 필요                | `stores` 메서드 활용 가능        |
| 검색 기능   | 커스텀 쿼리 작성 필요             | `where`, `filter`, `sortBy` 지원 |
| 업그레이드  | 버전 업그레이드 시 수동 처리 필요 | `.upgrade()` 기능 제공           |

---

## 8. 결론

IndexedDB는 클라이언트 측에서 데이터를 저장하는 강력한 기능을 제공하지만, 기본 API는 다소 복잡하고 사용하기 어렵습니다. Dexie.js를 사용하면 IndexedDB의 강력한 기능을 유지하면서 더욱 직관적인 방식으로 데이터를 관리할 수 있습니다.
