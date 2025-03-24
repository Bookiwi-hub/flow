```json
{
  // 프로젝트 이름, '@flow/monorepo'는 모노레포임을 나타냄
  // '@flow/'는 네임스페이스로 조직/그룹을 구분
  "name": "@flow/monorepo",

  // 이 프로젝트가 비공개임을 표시
  // npm 같은 패키지 저장소에 공개 배포 안 함
  "private": true,

  // 실행 가능한 명령어 정의
  "scripts": {
    // 'turbo run build'를 실행해 모노레포 전체 프로젝트 빌드
    // Turborepo가 각 하위 프로젝트의 'build' 스크립트 실행
    "build": "turbo run build",

    // 개발 모드로 실행, '--parallel'로 모든 프로젝트 동시 실행
    // 예: 웹 앱과 API를 같이 띄움
    "dev": "turbo run dev --parallel",

    // 코드 품질 체크, 각 프로젝트의 'lint' 스크립트 실행
    "lint": "turbo run lint",

    // 모노레포 내 패키지를 공개 배포
    // 'pnpm -r'은 하위 패키지에서 실행, '--access public'은 공개 설정
    // (주의: 'private: true'와 모순될 수 있음)
    "release": "pnpm -r publish --access public",

    // Git 훅 설정 도구 Husky 설치
    // 프로젝트 초기화나 Git 저장소 설정 시 실행
    "prepare": "husky install"
  },

  // Git 커밋 전 자동으로 실행할 작업 정의
  "lint-staged": {
    // 지정된 파일 확장자는 Prettier로 포맷팅
    // 코드 스타일을 일관되게 정리
    "*.{js,json,css,ts,tsx,md,mdx}": "prettier --write",

    // 'pnpm-lock.yaml'을 제외한 YAML 파일 포맷팅
    // 락파일은 건드리지 않음
    "!(pnpm-lock).{yml,yaml}": "prettier --write",

    // JS/TS 파일을 ESLint로 검사하고 자동 수정
    // 코드 오류나 스타일 문제 해결
    "*.{js,ts,tsx}": "eslint --fix"
  },

  // 개발에만 필요한 의존성 목록
  "devDependencies": {
    // GitHub 스타일 변경 로그 생성 도구
    "@changesets/changelog-github": "0.4.4",

    // 버전 관리 및 변경 로그 CLI 도구
    "@changesets/cli": "2.22.0",

    // TypeScript용 ESLint 플러그인
    "@typescript-eslint/eslint-plugin": "5.19.0",

    // 플랫폼 간 환경 변수 설정 도구
    "cross-env": "7.0.3",

    // 코드 린팅 기본 도구
    "eslint": "8.13.0",

    // Next.js에 맞춘 ESLint 설정
    "eslint-config-next": "12.1.5",

    // Prettier와 ESLint 충돌 방지 설정
    "eslint-config-prettier": "8.5.0",

    // React용 ESLint 플러그인
    "eslint-plugin-react": "7.29.4",

    // Node.js 및 브라우저를 위한 최소한의 TypeScript 상태 관리 라이브러리.
    // https://www.npmjs.com/package/enso
    "esno": "0.14.1",

    // Git 훅 관리 도구
    "husky": "7.0.4",

    // 커밋 전 코드 정리 도구
    "lint-staged": "12.3.7",

    // 코드 포맷팅 도구
    "prettier": "2.6.2",

    // Tailwind CSS와 Prettier 통합 플러그인
    "prettier-plugin-tailwindcss": "0.1.8",

    // 파일/폴더 삭제 도구
    //rm -rf for node in a cross-platform implementation.
    //https://www.npmjs.com/package/rimraf
    "rimraf": "3.0.2",

    // JavaScript/TypeScript 번들링 도구
    // JavaScript 파일을 하나로 묶고 최적화해주는 도구.
    // Tree Shaking으로 불필요한 코드 제거, 라이브러리 제작에 최적.
    // TypeScript로 작성된 코드를 번들링하고 배포용 패키지로 만들 때 사용.
    // https://www.npmjs.com/package/rollup
    "rollup": "2.72.1",

    // Rollup용 타입 선언 파일 생성 플러그인
    "rollup-plugin-dts": "4.2.1",

    // Rollup에서 TypeScript 지원 플러그인
    "rollup-plugin-typescript2": "0.31.2",

    // TypeScript를 빠르고 간단하게 빌드하고 번들링해주는 도구
    // JavaScript나 TypeScript로 작성된 코드를 실행 가능한 파일로 변환하거나, 배포할 수 있는 형태로 묶어주는 역할
    "tsup": "5.12.7",

    // 모노레포 관리 도구(Turborepo)
    "turbo": "1.11.3",

    // TypeScript 컴파일러
    "typescript": "4.6.3"
  },

  // 실행에 필요한 Node.js 버전 지정
  // 최소 18.0.0 이상이어야 동작 보장
  "engines": {
    "node": ">=18.0.0"
  }
}
```
