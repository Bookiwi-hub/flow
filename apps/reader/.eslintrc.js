/**
 * @author 조현지
 * @description ESLint 설정 파일
 * @date 2025-03-16
 */

module.exports = {
  extends: ['../../.eslintrc.js'], // 상위 디렉토리의 ESLint 설정을 상속받는다.
  rules: {
    '@next/next/no-html-link-for-pages': 'off', // Next.js 페이지에 대한 HTML 링크 사용 금지 규칙을 비활성화한다.
    '@next/next/no-img-element': 'off', // Next.js에서 img 요소 사용 금지 규칙을 비활성화한다.
    'react/jsx-key': 'off', // React 배열 요소에 key 속성 필수 규칙을 비활성화한다.
    'react/no-children-prop': 'off', // React children을 prop으로 전달 금지 규칙을 비활성화한다.
    'react-hooks/exhaustive-deps': [
      'warn', // 의존성 배열 누락 시 경고를 표시한다.
      {
        additionalHooks: 'useRecoilCallback|useRecoilTransaction_UNSTABLE', // 추가 훅에 대한 의존성 검사를 활성화한다.
      },
    ],
  },
}
