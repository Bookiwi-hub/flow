/**
 * 원격 파일 및 책 데이터를 가져오는 훅 모음
 *
 * 이 파일은 Dropbox에 저장된 EPUB 파일 목록과 책 메타데이터를 가져오는
 * 두 가지 훅(useRemoteFiles, useRemoteBooks)을 제공합니다.
 *
 * SWR 라이브러리를 사용하는 이유
 * - SWR은 "stale-while-revalidate"의 약자로, 캐시에서 먼저 데이터를 제공하고(stale)
 *   백그라운드에서 최신 데이터를 가져오는(revalidate) 전략을 사용하는 데이터 페칭 라이브러리
 *
 * 리액트 쿼리랑 같은 기능을 하는데 왜 SWR을 사용했는지 궁금해서 찾아봄

 * - React Query와 비교했을 때 SWR의 장점
 *   1) 더 간결한 API - 직관적인 단일 훅 인터페이스로 코드 작성이 쉬움
 *   2) 번들 크기가 더 작음 - React Query는 약 12KB, SWR은 약 6KB(gzipped)
 *   3) Next.js와의 통합 - Vercel에서 개발한 라이브러리로 Next.js와 최적화됨(SWR 버셀에서 나온 라이브러리)
 *   4) 더 단순한 캐싱 - 이 애플리케이션의 단순한 데이터 요구사항에 더 적합함
 *   5) immutable 데이터 옵션 - 성능 최적화를 위한 불변 모드 지원
 *
 * - 이 프로젝트에서 주로 다음 기능들을 활용함
 *   1) 자동 재검증 - 포커스/재연결 시 자동으로 데이터 갱신
 *   2) 중복 요청 방지 - 동일 키에 대한 여러 요청을 하나로 합침(캐시를 이용하여 중복 요청 방지)
 *   3) 낙관적 UI 업데이트 - mutate 함수로 즉각적인 UI 반응 제공
 */

import useSWR from 'swr/immutable'

import {
  DATA_FILENAME,
  dropboxBooksFetcher,
  dropboxFilesFetcher,
} from '@flow/reader/sync'

/**
 * Dropbox에 저장된 EPUB 파일 목록을 가져오는 훅
 *
 * 이 훅은 원격 저장소(Dropbox)에서 EPUB 파일 목록 가져오기기
 * useSWR을 사용하여 데이터 캐싱 및 자동 갱신 기능을 제공
 *
 * 작동 방식:
 * 1. '/files' 경로에서 dropboxFilesFetcher 함수를 사용해 파일 목록 조회
 * 2. 성능 최적화를 위해 immutable 모드 사용 (swr/immutable 임포트)
 * 3. shouldRetryOnError: false 옵션으로 오류 시 재시도 방지
 *
 * 반환값:
 * - data: 파일 목록 배열 (name, path, size 등 포함)
 * - error: 오류 정보 (있는 경우)
 * - mutate: 수동으로 데이터를 갱신하는 함수
 *   → 파일 업로드/삭제 후 목록 업데이트에 사용
 *
 * 주요 사용처:
 * - 'apps/reader/src/pages/index.tsx'의 Library 컴포넌트에서 사용됨
 *   → 원격 파일 목록 표시 및 다운로드 가능한 파일 확인
 * - 파일 업로드 후 목록 갱신
 *   → mutateRemoteFiles() 호출로 파일 목록 즉시 업데이트
 */
export function useRemoteFiles() {
  return useSWR('/files', dropboxFilesFetcher, { shouldRetryOnError: false })
}

/**
 * Dropbox에 저장된 책 메타데이터를 가져오는 훅
 *
 * 드롭박스에 책에 메타데이터를 따로 저장을 하는 방식으로 보임
 *
 * 이 훅은 Dropbox에 저장된 'data.json' 파일에서 책 메타데이터와 읽기 상태를 가져온뒤에
 * useSWR을 사용하여 데이터 캐싱 및 자동 갱신 기능을 제공합니다.
 *
 * 작동 방식
 * 1. DATA_FILENAME 경로('data.json')에서 dropboxBooksFetcher 함수로 데이터 조회
 * 2. 성능 최적화를 위해 immutable 모드 사용 (swr/immutable 임포트)
 * 3. shouldRetryOnError: false 옵션으로 오류 시 재시도 방지
 *
 * 반환값
 * - data: 책 메타데이터 배열 (다음 정보 포함)
 *   → 기본 정보 (id, name, size, metadata)
 *   → 읽기 상태 (cfi, percentage)
 *   → 주석 (annotations)
 *   → 사용자 정의 (definitions)
 *   → 설정 (configuration)
 * - error: 오류 정보 (있는 경우)
 * - mutate: 수동으로 데이터를 갱신하는 함수
 *   → useSync 훅에서 원격 데이터 업데이트에 사용
 *
 * 주요 사용처:
 * - 'apps/reader/src/hooks/remote/useSync.ts'의 useSync 훅에서 사용됨
 *   → 책 데이터 동기화 및 업데이트
 * - 'apps/reader/src/pages/index.tsx'의 useEffect에서 사용됨
 *   → 원격 책 데이터와 로컬 데이터 동기화
 */
export function useRemoteBooks() {
  return useSWR(`/${DATA_FILENAME}`, dropboxBooksFetcher, {
    shouldRetryOnError: false,
  })
}
