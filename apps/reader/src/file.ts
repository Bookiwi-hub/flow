/**
 * @author ☯채종민
 * @description EPUB 파일 처리 및 데이터베이스 저장을 위한 모듈
 * @date 2025-03-20
 */

import { v4 as uuidv4 } from 'uuid' // 고유 ID 생성을 위한 UUID 라이브러리

import ePub, { Book } from '@flow/epubjs' // EPUB 파일 처리를 위한 라이브러리

import { BookRecord, db } from './db' // 데이터베이스와 책 레코드 타입 정의
import { mapExtToMimes } from './mime' // 파일 확장자와 MIME 타입 매핑
import { unpack } from './sync' // ZIP 파일 언팩 함수

/**
 * 파일을 EPUB 객체로 변환하는 함수
 * @param {File} file - 변환할 파일 객체
 * @returns {Promise<Book>} EPUB 객체를 반환
 */
export async function fileToEpub(file: File) {
  const data = await file.arrayBuffer() // 파일을 ArrayBuffer로 읽음 (바이너리 데이터로 변환)
  return ePub(data) // ArrayBuffer를 EPUB 객체로 변환하여 반환
}

/**
 * 파일 목록을 받아와서 데이터베이스에 없으면 추가하는 함수
 * @param {Iterable<File>} files - 처리할 파일 목록
 * @returns {Promise<BookRecord[]>} 추가된 책 레코드 배열
 */
export async function handleFiles(files: Iterable<File>) {
  const books = await db?.books.toArray() // 데이터베이스에서 기존 책 목록을 가져옴
  const newBooks = [] // 새로 추가된 책을 저장할 배열

  for (const file of files) {
    console.log(file) // 파일 정보를 콘솔에 출력 (디버깅용)

    if (mapExtToMimes['.zip'].includes(file.type)) {
      // 파일이 ZIP 형식인지 확인
      unpack(file) // ZIP 파일을 풀어서 그 안의 데이터를 데이터베이스에 정리
      continue // 다음 파일로 넘어감
    }

    if (!mapExtToMimes['.epub'].includes(file.type)) {
      // 파일이 EPUB 형식이 아니면
      console.error(`Unsupported file type: ${file.type}`) // 지원되지 않는 형식이면 에러 출력
      continue // 다음 파일로 넘어감
    }

    let book = books?.find((b) => b.name === file.name) // 기존 책 중 동일한 이름의 책을 찾음

    if (!book) {
      // 동일한 책이 없으면 새로 추가
      book = await addBook(file) // 새로운 책을 데이터베이스에 추가
    }

    newBooks.push(book) // 새로 추가된 책을 배열에 저장
  }

  return newBooks // 추가된 책 목록 반환
}

/**
 * 새로운 책을 데이터베이스에 추가하는 함수
 * @param {File} file - 추가할 EPUB 파일
 * @returns {Promise<BookRecord>} 추가된 책 레코드
 */
export async function addBook(file: File) {
  const epub = await fileToEpub(file) // 파일을 EPUB 객체로 변환
  const metadata = await epub.loaded.metadata // EPUB 메타데이터 로드 (제목, 저자 등)

  const book: BookRecord = {
    // 데이터베이스에 저장할 책 레코드 생성
    id: uuidv4(), // 고유 ID 생성
    name: file.name || `${metadata.title}.epub`, // 파일 이름이 없으면 메타데이터 제목 사용
    size: file.size, // 파일 크기 (바이트 단위)
    metadata, // EPUB 메타데이터
    createdAt: Date.now(), // 책이 추가된 시간 (타임스탬프)
    definitions: [], // 정의 목록 (초기값 빈 배열)
    annotations: [], // 주석 목록 (초기값 빈 배열)
  }
  db?.books.add(book) // 데이터베이스에 책 추가
  addFile(book.id, file, epub) // 파일과 커버 이미지를 데이터베이스에 저장
  return book // 추가된 책 객체 반환
}

/**
 * 파일과 커버 이미지를 데이터베이스에 추가하는 함수
 * @param {string} id - 책의 고유 ID
 * @param {File} file - 저장할 파일 객체
 * @param {Book} [epub] - EPUB 객체 (선택적)
 * @returns {Promise<void>}
 */
export async function addFile(id: string, file: File, epub?: Book) {
  db?.files.add({ id, file }) // 파일을 데이터베이스에 저장

  if (!epub) {
    // EPUB 객체가 제공되지 않은 경우
    epub = await fileToEpub(file) // 파일을 EPUB 객체로 변환
  }

  const url = await epub.coverUrl() // EPUB에서 커버 이미지 URL 가져오기
  const cover = url && (await toDataUrl(url)) // URL이 있으면 Data URL로 변환
  db?.covers.add({ id, cover }) // 커버 이미지를 데이터베이스에 저장
}

/**
 * Blob 데이터(대용량 바이너리 데이터)를 읽는 유틸리티 함수
 * `FileReader`를 활용하여 Blob 데이터를 비동기적으로 읽습니다. `FileReader`는 브라우저에서 제공하는 Web API로,
 * 파일이나 Blob 객체의 내용을 읽기 위한 도구
 * @param {(reader: FileReader) => void} fn - FileReader를 사용하는 콜백 함수
 * @returns {Promise<string>} 읽은 데이터 (문자열)
 */
export function readBlob(fn: (reader: FileReader) => void) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader() // FileReader 객체 생성
    reader.addEventListener('load', () => {
      // 읽기 완료 이벤트 리스너
      resolve(reader.result as string) // 읽은 데이터를 문자열로 반환
    })
    fn(reader) // 제공된 함수를 통해 FileReader 실행
  })
}

/**
 * URL을 Data URL로 변환하는 함수
 * 이 함수는 주어진 URL에서 데이터를 가져와 Blob으로 변환한 뒤, FileReader를 통해 Data URL로 변환합니다.
 * Data URL은 데이터를 URL 형식으로 인코딩한 문자열로, MIME 타입과 Base64 인코딩된 데이터를 포함합니다.
 * 예: "data:image/png;base64,iVBORw0KGgo..." (이미지), "data:text/plain;charset=utf-8,Hello" (텍스트).
 * 네트워크 요청 없이 데이터를 직접 사용할 수 있게 합니다.
 *
 * @param {string} url - 변환할 URL (예: "https://example.com/image.png")
 * @returns {Promise<string>} Data URL 문자열 (예: "data:image/png;base64,...")
 */
async function toDataUrl(url: string) {
  const res = await fetch(url) // URL에서 데이터 가져오기 (네트워크 요청 수행)
  const buffer = await res.blob() // 응답을 Blob으로 변환 (바이너리 데이터로 저장)
  return readBlob((r) => r.readAsDataURL(buffer)) // Blob을 Data URL로 변환하여 반환
}

/**
 * URL에서 책을 가져와 데이터베이스에 추가하는 함수
 * @param {string} url - EPUB 파일의 URL
 * @returns {Promise<BookRecord>} 추가된 책 레코드
 */
export async function fetchBook(url: string) {
  const filename = decodeURIComponent(/\/([^/]*\.epub)$/i.exec(url)?.[1] ?? '') // URL에서 EPUB 파일 이름 추출
  const books = await db?.books.toArray() // 데이터베이스에서 기존 책 목록 가져오기
  const book = books?.find((b) => b.name === filename) // 동일한 이름의 책 찾기

  return (
    book ?? // 기존 책이 있으면 반환, 없으면 새로 추가
    fetch(url) // URL에서 데이터 가져오기
      .then((res) => res.blob()) // 응답을 Blob으로 변환
      .then((blob) => addBook(new File([blob], filename))) // Blob을 File 객체로 변환 후 책 추가
  )
}
