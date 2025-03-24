/**
 * @author ☯채종민
 * @description db.ts 파일: IndexedDB를 Dexie 라이브러리를 통해 관리하는 데이터베이스 클래스 정의
 * @date 2025-03-20
 */

import { IS_SERVER } from '@literal-ui/hooks' // 서버 환경인지 확인하는 유틸리티 (서버에서는 IndexedDB를 사용할 수 없음)
import Dexie, { Table } from 'dexie' // Dexie 라이브러리와 Table 타입 가져오기

import { PackagingMetadataObject } from '@flow/epubjs/types/packaging' // EPUB 메타데이터 타입

import { Annotation } from './annotation' // 어노테이션 타입
import { fileToEpub } from './file' // 파일을 EPUB 객체로 변환하는 함수
import { TypographyConfiguration } from './state' // 타이포그래피 설정 타입

// 파일 정보를 저장하는 인터페이스 정의
export interface FileRecord {
  id: string // 파일의 고유 식별자
  file: File // 실제 파일 객체 (브라우저의 File API 사용)
}

// 책 표지 정보를 저장하는 인터페이스 정의
export interface CoverRecord {
  id: string // 표지의 고유 식별자
  cover: string | null // 표지 이미지의 URL 또는 null (표지가 없는 경우)
}

/**
 * 책의 상세 정보 타입
 * - id: 책의 고유 식별자 (TODO: 파일 해시를 ID로 사용할 계획)
 * - name: 책 이름
 * - size: 파일 크기 (바이트 단위)
 * - metadata: EPUB 메타데이터 객체
 * - createdAt: 생성 시간 (타임스탬프)
 * - updatedAt?: 수정 시간 (선택적, 타임스탬프)
 * - cfi?: 현재 읽기 위치 (EPUB CFI 형식, 선택적)
 * - percentage?: 읽기 진행률 (0~1 사이 값, 선택적)
 * - definitions: 책 내 정의된 용어 목록
 * - annotations: 하이라이트 목록
 * - configuration?: 타이포그래피 설정 등 (선택적)
 */
export interface BookRecord {
  id: string // TODO: use file hash as id
  name: string
  size: number
  metadata: PackagingMetadataObject
  createdAt: number
  updatedAt?: number
  cfi?: string
  percentage?: number
  definitions: string[]
  annotations: Annotation[]
  configuration?: {
    typography?: TypographyConfiguration
  }
}

/**
 * Dexie를 상속받아 데이터베이스를 관리하는 클래스
 * - files: 파일 정보 저장하는 테이블
 * - covers: 커버 이미지 정보 저장하는 테이블
 * - books: 책 정보 저장하는 테이블
 */
export class DB extends Dexie {
  // 테이블 타입 선언 (Dexie가 stores()에서 자동으로 추가하지만 타입 시스템을 위해 명시)
  //!는 TypeScript에서 나중에 초기화될 것임을 나타낸다.
  files!: Table<FileRecord>
  covers!: Table<CoverRecord>
  books!: Table<BookRecord>

  //현재 사용하는 버전은 가장 높은 버전인 5다.
  //버전 1~5로 가면서 데이터베이스가 완성된다.
  //버전으로 관리하는 이유
  //기존 사용자들이 버전 3, 4을 사용하고 있었다면, 앱 업데이트 시 기존 데이터를 잘 유지하면서  버전 5로 자동 마이그레이션됨
  // 추후 데이터베이스가 수정되어서 버전 6이 생기면 버전 5를 쓰던 앱을 업데이트 했을 때 버전 6으로 바뀐다.

  /**
   * 생성자: 데이터베이스 이름을 받아 초기화하고, 버전 및 스키마를 설정
   * @param name 데이터베이스 이름
   */
  constructor(name: string) {
    super(name) // Dexie의 생성자를 호출하여 데이터베이스 이름을 설정

    /**
     * 버전 5: 최신 스키마 정의
     * - books 테이블에 configuration 필드 추가
     */
    this.version(5).stores({
      books:
        'id, name, size, metadata, createdAt, updatedAt, cfi, percentage, definitions, annotations, configuration',
    })

    /**
     * 버전 4: annotations 필드 추가
     * - 업그레이드 로직: 기존 books 레코드에 annotations 필드를 빈 배열로 초기화
     */
    this.version(4)
      .stores({
        books:
          'id, name, size, metadata, createdAt, updatedAt, cfi, percentage, definitions, annotations',
      })
      .upgrade(async (t) => {
        t.table('books')
          .toCollection()
          .modify((r) => {
            r.annotations = [] // annotations 필드를 빈 배열로 설정
          })
      })

    /**
     * 버전 3: metadata와 size 필드 추가
     * - 업그레이드 로직: files 테이블에서 EPUB 메타데이터와 파일 크기를 추출하여 books 테이블에 적용
     */
    this.version(3)
      .stores({
        books:
          'id, name, size, metadata, createdAt, updatedAt, cfi, percentage, definitions',
      })
      .upgrade(async (t) => {
        // files 테이블에서 파일 정보를 가져옴
        const files = await t.table('files').toArray() // files 테이블 데이터 가져오기

        // 모든 파일에서 EPUB 메타데이터를 비동기적으로 추출
        const metadatas = await Dexie.waitFor(
          Promise.all(
            files.map(async ({ file }) => {
              const epub = await fileToEpub(file) // 파일을 EPUB 객체로 변환
              return epub.loaded.metadata // 메타데이터 반환
            }),
          ),
        )

        // books 테이블 레코드를 수정하여 metadata와 size 추가
        return t
          .table('books')
          .toCollection()
          .modify(async (r) => {
            const i = files.findIndex((f) => f.id === r.id) // 동일한 ID의 파일 인덱스 찾기
            r.metadata = metadatas[i] // 메타데이터 설정
            r.size = files[i].file.size // 파일 크기 설정
          })
          .catch((e) => {
            console.error(e) // 오류 로깅
            throw e // 오류 재발생
          })
      })

    /**
     * 버전 2: ID 일치 조정
     * - 업그레이드 로직: covers와 files 테이블의 ID를 books 테이블의 ID와 동기화
     */
    this.version(2)
      .stores({
        books: 'id, name, createdAt, cfi, percentage, definitions',
      })
      .upgrade(async (t) => {
        const books = await t.table('books').toArray() // books 테이블 데이터 가져오기
        // covers와 files 테이블의 id를 books 테이블의 id와 일치하도록 수정
        ;['covers', 'files'].forEach((tableName) => {
          // covers와 files 테이블 순회
          t.table(tableName)
            .toCollection()
            .modify((r) => {
              const book = books.find((b) => b.name === r.id) // 이름으로 책 찾기
              if (book) r.id = book.id // ID 일치 시 업데이트
            })
        })
      })

    /**
     * 버전 1: 초기 스키마 정의
     * - books, covers, files 테이블의 기본 구조 설정
     */
    this.version(1).stores({
      books: 'id, name, createdAt, cfi, percentage, definitions', // 기본 필드 및 인덱스
      covers: 'id, cover', // 커버 이미지 테이블
      files: 'id, file', // 파일 테이블
    })
  }
}

/**
 * 데이터베이스 인스턴스 생성
 * - 서버 환경(IS_SERVER가 true)에서는 null 반환
 * - 클라이언트 환경에서는 're-reader'라는 이름으로 DB 인스턴스 생성
 */
export const db = IS_SERVER ? null : new DB('re-reader')
