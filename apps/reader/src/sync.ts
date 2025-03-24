/**
 * @author ☯채종민
 * @description Dropbox와의 데이터 동기화 및 로컬 백업/복원 기능을 제공
 * @date 2025-03-21
 */

// Dropbox API를 사용하기 위한 Dropbox 클래스를 가져옵니다.
import { Dropbox } from 'dropbox'
// 파일을 다운로드하고 저장하기 위한 saveAs 함수를 가져옵니다.
import { saveAs } from 'file-saver'
// ZIP 파일을 생성하고 처리하기 위한 JSZip 라이브러리를 가져옵니다.
import JSZip from 'jszip'
// 쿠키를 파싱하기 위한 parseCookies 함수를 가져옵니다.
import { parseCookies } from 'nookies'

// indexDB와 책 레코드 타입을 가져옵니다.
import { BookRecord, db } from './db'
// Blob 데이터를 읽기 위한 유틸리티 함수를 가져옵니다.
import { readBlob } from './file'

// 토큰 매핑 객체: 서비스 이름을 로컬 스토리지 키에 매핑합니다.
export const mapToToken = {
  dropbox: 'dropbox-refresh-token',
}

// OAuth 성공 메시지 상수
export const OAUTH_SUCCESS_MESSAGE = 'oauth_success'

// Dropbox 인스턴스를 초기화합니다. 초기 refreshToken은 임시 값으로 설정됩니다.
export const dbx = new Dropbox({
  clientId: process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID,
  refreshToken: '__fake_token__',
})
let _req: Promise<void> | undefined
/**
 * Dropbox 인증 토큰을 갱신하는 함수를 오버라이드합니다.
 * @return {Promise<void>} - 토큰 갱신 요청의 Promise
 * @example
 * await dbx.auth.refreshAccessToken();
 */
dbx.auth.refreshAccessToken = () => {
  const cookies = parseCookies() // 현재 쿠키를 파싱하여 객체로 반환

  const refreshToken = cookies[mapToToken['dropbox']] // 쿠키에서 Dropbox refreshToken을 가져옴

  if (!refreshToken) {
    // refreshToken이 존재하지 않는지 확인
    return Promise.reject() // refreshToken이 없으면 Promise를 거부하여 API 요청 스킵
  }

  _req ??= fetch(`/api/refresh`) // _req가 undefined일 경우에만 새 토큰 갱신 요청 생성
    .then((res) => res.json()) // 응답을 JSON 형식으로 변환
    .then((data) => {
      dbx.auth.setAccessToken(data.accessToken) // 새로운 액세스 토큰을 Dropbox 인스턴스에 설정
      dbx.auth.setAccessTokenExpiresAt(data.accessTokenExpiresAt) // 토큰 만료 시간을 설정
    })
    .finally(() => {
      _req = undefined // 요청이 완료되면 _req를 초기화하여 다음 요청 준비
    })

  return _req // 토큰 갱신 요청 Promise 반환
}

// 직렬화된 책 데이터를 위한 인터페이스
interface SerializedBooks {
  version: number // 데이터 형식의 버전 번호
  dbVersion: number // indexDB 버전 번호
  books: BookRecord[] // 책 레코드 배열
}

// 현재 버전 상수
const VERSION = 1
// 데이터 파일 이름 상수
export const DATA_FILENAME = 'data.json'

/**
 * 책 데이터를 JSON 문자열로 직렬화하는 함수
 * @param {BookRecord[]} [books] - 직렬화할 책 레코드 배열 (선택적)
 * @return {string} - 직렬화된 JSON 문자열
 * @example
 * const json = serializeData(books);
 */
function serializeData(books?: BookRecord[]) {
  return JSON.stringify({
    version: VERSION,
    dbVersion: db?.verno, // 현재 indexDB 버전(dexie 기능)
    books,
  })
}

/**
 * JSON 문자열을 책 데이터로 역직렬화하는 함수
 * @param {string} text - 역직렬화할 JSON 문자열
 * @return {BookRecord[]} - 역직렬화된 책 레코드 배열
 * @example
 * const books = deserializeData(json);
 */
function deserializeData(text: string) {
  const { version, dbVersion, books } = JSON.parse(text) as SerializedBooks

  if (version < VERSION) {
    // migrate `data.json` (현재는 구현되지 않음)
  }
  if (db && dbVersion < db.verno) {
    // migrate `BookRecord` (현재는 구현되지 않음)
  }

  return books
}

/**
 * 책 데이터를 Dropbox에 업로드하는 함수
 * @param {BookRecord[]} books - 업로드할 책 레코드 배열
 * @return {Promise<any>} - Dropbox API의 파일 업로드 응답
 * @example
 * await uploadData(books);
 */
export async function uploadData(books: BookRecord[]) {
  return dbx.filesUpload({
    // Dropbox에 파일 업로드 요청
    path: `/${DATA_FILENAME}`, // 업로드 경로 설정 (예: /data.json)
    mode: { '.tag': 'overwrite' }, // 기존 파일을 덮어쓰는 모드 지정
    contents: serializeData(books), // 직렬화된 책 데이터를 업로드 내용으로 사용
  })
}

/**
 * Dropbox에서 파일 목록을 가져오는 함수
 * @param {string} path - 파일 목록을 가져올 Dropbox 경로
 * @return {Promise<any[]>} - Dropbox 파일 목록의 entries
 * @example
 * const files = await dropboxFilesFetcher('/books');
 */
export const dropboxFilesFetcher = (path: string) => {
  return dbx
    .filesListFolder({ path }) // 지정된 경로의 파일 목록을 Dropbox에서 요청
    .then((d) => d.result.entries) // 응답에서 파일 목록(entries)만 추출하여 반환
}

/**
 * Dropbox에서 책 데이터를 다운로드하고 역직렬화하는 함수
 * @param {string} path - 다운로드할 파일의 Dropbox 경로
 * @return {Promise<BookRecord[]>} - 역직렬화된 책 레코드 배열
 * @example
 * const books = await dropboxBooksFetcher('/data.json');
 */
export const dropboxBooksFetcher = (path: string) => {
  return dbx
    .filesDownload({ path }) // 지정된 경로에서 파일을 Dropbox에서 다운로드
    .then((d) => {
      const blob: Blob = (d.result as any).fileBlob // 다운로드된 결과에서 Blob 객체 추출
      return readBlob((r) => r.readAsText(blob)) // Blob을 텍스트로 읽는 Promise 반환
    })
    .then((d) => deserializeData(d)) // 읽은 텍스트를 역직렬화하여 책 데이터 반환
}

/**
 * 로컬 데이터를 ZIP 파일로 백업하는 함수
 * @return {Promise<void>} - ZIP 파일 생성 및 다운로드
 * @example
 * await pack();
 */
export async function pack() {
  const books = await db?.books.toArray() // 데이터베이스에서 모든 책 레코드 가져오기

  const covers = await db?.covers.toArray() // 데이터베이스에서 모든 커버 데이터 가져오기

  const files = await db?.files.toArray() // 데이터베이스에서 모든 파일 데이터 가져오기

  const zip = new JSZip() // 새로운 JSZip 인스턴스 생성

  zip.file(DATA_FILENAME, serializeData(books)) // data.json 파일을 ZIP에 추가

  zip.file('covers.json', JSON.stringify(covers)) // covers.json 파일을 ZIP에 추가

  const folder = zip.folder('files') // ZIP 내에 'files' 폴더 생성

  files?.forEach((f) => folder?.file(f.file.name, f.file)) // 각 파일을 'files' 폴더에 추가

  const date = new Intl.DateTimeFormat('fr-CA').format().replaceAll('-', '')
  // 현재 날짜를 'YYYYMMDD' 형식으로 포맷
  // Intl.DateTimeFormat은 날짜를 로케일에 맞게 포맷팅하는 국제화 API

  return zip
    .generateAsync({ type: 'blob' }) // ZIP 파일을 Blob 형식으로 생성
    .then((content) => {
      saveAs(content, `flow_backup_${date}.zip`) // Blob을 'flow_backup_YYYYMMDD.zip'로 저장 (다운로드)
    })
}

/**
 * ZIP 파일에서 데이터를 복원하는 함수
 * @param {File} file - 복원할 ZIP 파일
 * @return {Promise<void>} - 데이터 복원 완료
 * @example
 * await unpack(zipFile);
 */
export async function unpack(file: File) {
  const zip = new JSZip() // 새로운 JSZip 인스턴스 생성

  await zip.loadAsync(file) // 입력된 ZIP 파일을 비동기적으로 로드

  const booksJSON = zip.file(DATA_FILENAME) // ZIP에서 data.json 파일 가져오기

  const coversJSON = zip.file('covers.json') // ZIP에서 covers.json 파일 가져오기

  if (!booksJSON || !coversJSON) return // data.json 또는 covers.json이 없으면 함수 종료

  const books = deserializeData(await booksJSON.async('text')) // data.json의 텍스트를 역직렬화하여 책 데이터 추출

  db?.books.bulkPut(books) // 추출한 책 데이터를 indexDB에 일괄 저장

  const coversText = await coversJSON.async('text') // covers.json의 텍스트 읽기

  db?.covers.bulkPut(JSON.parse(coversText)) // 커버 데이터를 파싱하여 indexDB에 일괄 저장

  const folder = zip.folder('files') // ZIP에서 'files' 폴더 가져오기

  folder?.forEach(async (_, f) => {
    // 'files' 폴더 내 각 파일에 대해 반복
    const book = books.find((b) => `files/${b.name}` === f.name) // 파일 이름과 매칭되는 책 레코드 찾기
    if (!book) return // 매칭되는 책이 없으면 스킵
    const data = await f.async('blob') // 파일을 Blob 형식으로 읽기
    const file = new File([data], book.name) // Blob을 File 객체로 변환
    db?.files.put({ file, id: book.id }) // 변환된 파일을 indexDB에 저장
  })
}
