const path = require('path') // Node.js의 경로 모듈을 불러와서 파일 경로 설정에 사용

module.exports = {
  root: true, // 현재 디렉토리를 ESLint의 최상위(root) 디렉토리로 설정 (하위 폴더의 다른 ESLint 설정이 덮어쓰지 않도록 방지)

  env: {
    node: true, // Node.js 환경에서 실행되는 코드임을 명시 (require, module.exports 같은 Node.js 문법을 사용 가능)
  },

  extends: [
    'eslint:recommended', // ESLint의 기본 추천 규칙 적용 (자바스크립트 기본 린트 규칙)
    'plugin:@typescript-eslint/recommended', // TypeScript ESLint 플러그인의 추천 규칙 사용
    'prettier', // Prettier와 충돌하는 ESLint 규칙을 비활성화하여 코드 포맷팅을 일관되게 유지
    'next', // Next.js 프로젝트에 최적화된 ESLint 규칙 적용
  ],

  settings: {
    next: {
      rootDir: path.join(__dirname, 'apps/reader'), // Next.js 프로젝트의 루트 디렉터리를 명시하여 ESLint가 프로젝트 구조를 인식하도록 설정
    },
  },

  parser: '@typescript-eslint/parser', // TypeScript 코드를 올바르게 해석하기 위해 기본 ESLint 파서를 TypeScript 전용 파서로 변경

  plugins: ['@typescript-eslint'], // TypeScript ESLint 플러그인을 활성화하여 추가적인 TypeScript 전용 규칙을 적용 가능하도록 설정

  rules: {
    // ✅ 사용되지 않는 변수 관련 규칙 설정
    'no-unused-vars': 'off', // 기본 ESLint의 `no-unused-vars` 규칙을 비활성화
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true, // 객체 구조 분해할당에서 나머지 속성은 무시
        argsIgnorePattern: '^_', // `_`로 시작하는 매개변수는 사용하지 않아도 오류 발생하지 않도록 설정
      },
    ],

    // ✅ TypeScript 관련 규칙 설정
    '@typescript-eslint/no-var-requires': 'off', // `require()` 사용을 허용 (CommonJS 방식 지원)
    '@typescript-eslint/no-empty-interface': 'off', // 빈 인터페이스 허용
    '@typescript-eslint/no-empty-function': 'off', // 빈 함수 허용
    '@typescript-eslint/no-non-null-assertion': 'off', // Non-null assertion (`!`) 허용
    '@typescript-eslint/ban-ts-comment': 'off', // `// @ts-ignore` 같은 TypeScript 주석 허용
    '@typescript-eslint/no-explicit-any': 'off', // `any` 타입 사용 허용

    // ✅ import 정렬 규칙 설정
    'import/no-anonymous-default-export': 'off', // 익명 default export 허용
    'no-empty': 'off', // 빈 블록문 `{}` 허용
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc' }, // import를 알파벳 순으로 정렬
        'newlines-between': 'always', // import 그룹 사이에 줄바꿈 추가
        groups: [
          'builtin', // 기본 제공 모듈 (예: fs, path)
          'external', // 외부 라이브러리 (예: react, axios)
          'internal', // 프로젝트 내부 모듈
          'parent', // 상위 디렉터리에서 import한 모듈
          'sibling', // 같은 디렉터리 내 다른 파일에서 import한 모듈
          'index', // index 파일에서 import한 모듈
        ],
        pathGroups: [{ pattern: '@flow/**', group: 'internal' }], // `@flow/`로 시작하는 import를 내부 모듈(`internal`)로 분류
        pathGroupsExcludedImportTypes: ['builtin'], // 기본 내장 모듈(`builtin`)에는 pathGroups 적용하지 않음
      },
    ],
  },
}
