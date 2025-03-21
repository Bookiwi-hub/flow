/**
 * @author ☯채종민
 * @description 파일 확장자로 MIME 타입을 알아내기 위한 객체
 * @date 2025-03-21
 */

/**
 *
 * MIME 타입이란?
 * MIME(Multipurpose Internet Mail Extensions) 타입은 파일이나 데이터의 형식을 나타내는 표준화된 식별자입니다.
 * MIME 타입은 HTTP 헤더(Content-Type)나 파일 업로드 시 브라우저가 데이터를 올바르게 해석하도록 돕습니다.
 */

/**
 * MIME 타입과 파일 확장자 간의 매핑을 정의하는 객체
 * 이 모듈은 파일 확장자(예: '.epub', '.zip')와 해당 MIME 타입을 연결하여,
 * 파일 형식을 식별하고 처리하는 데 사용됩니다. MIME 타입은 브라우저나 서버가 파일을
 * 올바르게 해석할 수 있도록 표준화된 형식입니다.
 *
 * 역할:
 * - '.epub': EPUB 파일을 식별하기 위한 MIME 타입 목록 제공.
 * - '.zip': ZIP 파일을 식별하기 위한 MIME 타입 목록 제공.
 *
 * 사용 예시 (file.ts에서):
 * @example
 * if (mapExtToMimes['.epub'].includes(file.type)) { ... } // EPUB 파일인지 확인
 * if (mapExtToMimes['.zip'].includes(file.type)) { ... } // ZIP 파일인지 확인
 */
export const mapExtToMimes = {
  '.epub': [
    // EPUB 파일 확장자에 대한 MIME 타입 배열
    'application/epub+zip', // EPUB은 ZIP 압축 형식 기반이므로 가장 일반적인 타입.
    'application/epub', // 일부 시스템에서 간소화된 대체 타입.
  ],
  '.zip': [
    // ZIP 파일 확장자에 대한 MIME 타입 배열
    'application/zip', // ZIP 파일의 표준 MIME 타입
    'application/zip-compressed', // ZIP 파일의 변형 MIME 타입 (일부 시스템 호환용)
    'application/x-zip-compressed', // ZIP 파일의 또 다른 변형 MIME 타입 (구형 시스템 호환용)
  ],
}
