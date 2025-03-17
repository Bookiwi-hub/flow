---
author: 조현지
description: @flow/reader 패키지 분석 및 의존성 정리
date: 2025-03-16
---

# @flow/reader 패키지 분석

## 기본 정보

- **패키지명**: `@flow/reader`
- **타입**: 비공개 패키지 (private: true)
- **목적**: EPUB 파일을 위한 웹 기반 리더 애플리케이션

## 스크립트 명령어

```json
"scripts": {
  "dev": "cross-env RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED=false next dev -p 7127",
  "build": "next build",
  "analyze": "cross-env ANALYZE=true next build",
  "start": "next start",
  "lint": "next lint"
}
```

- **dev**: 개발 서버를 7127 포트로 실행. Recoil의 중복 atom 키 검사를 비활성화함
- **build**: Next.js 프로젝트를 빌드함
- **analyze**: 번들 분석기를 활성화하여 빌드 과정에서 번들 크기와 구성을 분석함
- **start**: 빌드된 프로젝트를 프로덕션 모드로 실행함
- **lint**: ESLint를 사용하여 코드 품질 검사를 실행함

## 의존성 패키지 (dependencies)

### 내부 워크스페이스 패키지

- **@flow/epubjs** (`workspace:*`): EPUB 파일 파싱 및 렌더링을 위한 내부 패키지
- **@flow/internal** (`workspace:*`): 프로젝트 내부에서 공유되는 유틸리티 및 컴포넌트

### 프레임워크 및 핵심 라이브러리

- **next** (`12.3.4`): React 기반 서버사이드 렌더링 프레임워크
- **next-seo** (`5.4.0`): Next.js 앱의 SEO를 관리하기 위한 도구
- **react** (`18.0.0`): UI 컴포넌트 구축을 위한 JavaScript 라이브러리
- **react-dom** (`18.0.0`): React를 웹 DOM에 렌더링하기 위한 패키지

### 상태 관리

- **recoil** (`0.7.6`): React 애플리케이션을 위한 상태 관리 라이브러리
- **valtio** (`1.6.0`): 프록시 기반의 상태 관리 라이브러리
- **swr** (`^1.3.0`): React Hooks를 사용한 데이터 페칭 라이브러리

### UI 라이브러리

- **@literal-ui/core** (`0.0.13`): UI 컴포넌트 라이브러리
- **@literal-ui/hooks** (`0.0.8`): React 커스텀 훅 모음
- **@literal-ui/next** (`0.0.3`): Next.js용 UI 컴포넌트 및 통합
- **react-icons** (`4.3.1`): 인기있는 아이콘 세트 모음
- **react-highlight-words** (`^0.18.0`): 텍스트 내 특정 단어를 하이라이트하는 컴포넌트
- **@types/react-highlight-words** (`^0.16.4`): react-highlight-words의 타입 정의

### 데이터 관리 및 스토리지

- **dexie** (`3.2.2`): IndexedDB를 위한 래퍼 라이브러리
- **dexie-react-hooks** (`1.1.1`): Dexie와 React Hooks 통합
- **dropbox** (`^10.32.0`): Dropbox API 클라이언트
- **nookies** (`^2.5.2`): Next.js용 쿠키 파싱 및 설정 유틸리티
- **use-local-storage-state** (`^18.1.1`): localStorage를 React state와 동기화하는 훅

### 파일 처리

- **file-saver** (`^2.0.5`): 클라이언트측 파일 저장 기능
- **jszip** (`^3.10.1`): JavaScript에서 ZIP 파일 생성 및 해제

### UI 컴포넌트 및 유틸리티

- **react-cool-virtual** (`0.7.0`): 가상화된 리스트 컴포넌트
- **react-focus-lock** (`^2.9.1`): 포커스 트랩 관리 컴포넌트
- **react-photo-view** (`^1.1.2`): 이미지 뷰어 컴포넌트
- **react-polymorphic-types** (`2.0.0`): 다형성 컴포넌트를 위한 타입 유틸리티
- **react-use** (`^17.4.0`): React Hooks 모음
- **clsx** (`1.1.1`): className 문자열을 조건부로 구성하는 유틸리티
- **tilg** (`^0.1.1`): 컴포넌트 디버깅 도구

### 유틸리티

- **@github/mini-throttle** (`^2.1.0`): 함수 호출 제한 유틸리티
- **@material/material-color-utilities** (`^0.2.0`): Material Design 색상 유틸리티
- **dayjs** (`^1.11.2`): 경량 날짜 처리 라이브러리
- **uuid** (`^8.3.2`): UUID 생성 라이브러리

### 빌드 및 분석

- **@next/bundle-analyzer** (`12.1.6`): Next.js 번들 분석 도구
- **babel-loader** (`8.2.5`): Webpack용 Babel 로더

### 모니터링 및 오류 추적

- **@sentry/nextjs** (`^7.12.1`): Next.js 앱을 위한 Sentry 통합

## 개발 의존성 (devDependencies)

### 스타일링

- **@flow/tailwind** (`workspace:*`): 프로젝트용 Tailwind CSS 설정 및 확장
- **tailwindcss** (`3.2.0`): 유틸리티 우선 CSS 프레임워크
- **@tailwindcss/aspect-ratio** (`0.4.2`): 종횡비 관련 Tailwind 플러그인
- **@tailwindcss/line-clamp** (`0.4.2`): 텍스트 라인 제한 Tailwind 플러그인
- **postcss** (`8.4.12`): CSS 변환 도구
- **autoprefixer** (`10.4.4`): 벤더 프리픽스 자동 추가 도구

### 빌드 도구

- **next-pwa** (`5.6.0`): Next.js 앱을 PWA로 변환하는 플러그인
- **next-transpile-modules** (`9.0.0`): node_modules 내 패키지를 트랜스파일하는 플러그인

### 타입스크립트 정의

- **@types/file-saver** (`^2.0.5`): file-saver의 타입 정의
- **@types/node** (`17.0.22`): Node.js의 타입 정의
- **@types/react** (`17.0.43`): React의 타입 정의
- **@types/uuid** (`^8.3.4`): UUID의 타입 정의
- **type-fest** (`2.12.2`): 유용한 TypeScript 타입 모음

## 엔진 요구사항

```json
"engines": {
  "node": ">=18.0.0"
}
```

- Node.js 18.0.0 이상 버전이 필요함

## 특이사항 및 분석

### 1. 워크스페이스 구조

- `workspace:*` 표기법은 pnpm이나 Yarn Berry의 워크스페이스 기능을 사용하는 모노레포 구조를 나타냄
- 내부 패키지(@flow/epubjs, @flow/internal, @flow/tailwind)가 있어 코드 재사용성을 높임

### 2. 애플리케이션 특성

- EPUB 파일 리더 기능에 특화된 앱으로, 전자책 표시 및 관리에 중점
- PWA(Progressive Web App) 지원
- Dropbox 통합으로 클라우드 스토리지 연결 기능 제공
- IndexedDB(Dexie)를 통한 로컬 데이터 저장

### 3. 개발 환경 특성

- React 18을 사용하지만 타입 정의는 React 17용을 사용 (@types/react: 17.0.43)
- 여러 상태 관리 라이브러리(Recoil, Valtio, SWR) 병행 사용
- SEO 최적화(next-seo) 및 오류 추적(Sentry) 구현
- Tailwind CSS를 기반으로 한 스타일링 시스템

### 4. 버전 관리 패턴

- 일부 패키지는 정확한 버전(react: 18.0.0)을, 다른 패키지는 유연한 버전(dayjs: ^1.11.2)을 사용
- 내부 워크스페이스 패키지는 항상 최신 버전 사용(workspace:\*)

### 5. 성능 최적화 포인트

- 가상화된 리스트(react-cool-virtual)로 대량의 콘텐츠 효율적 표시
- 번들 분석기를 통한 번들 크기 모니터링
- 이미지 및 사진 최적화 도구 사용
