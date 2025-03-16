/**
 * @author 조현지
 * @description Tailwind CSS 설정 파일
 * @date 2025-03-16
 */

/**
 * @type {import('tailwindcss').Config}
 * TypeScript에서 Tailwind CSS 설정의 타입 지원을 위한 JSDoc 주석
 */
module.exports = {
  darkMode: 'class', // 다크 모드 활성화 방식을 'class'로 설정한다 (HTML 요소에 dark 클래스 추가로 다크 모드 적용한다)
  content: [
    './src/**/*.{tsx,ts}', // 프로젝트 내 모든 TypeScript 및 TSX 파일에서 Tailwind 클래스를 스캔한다
    './node_modules/@literal-ui/core/**/*.js', // @literal-ui/core 라이브러리 내 JavaScript 파일도 스캔 대상에 포함한다
  ],
  theme: {
    extend: {},
    container: {
      // container 클래스 사용 시 적용할 css
      center: true,
      padding: '1rem',
    },
  },
  plugins: [
    require('@flow/tailwind'), // flow 관련 Tailwind 플러그인을 추가한다
    require('@tailwindcss/line-clamp'), // 텍스트 줄 수 제한을 위한 line-clamp 플러그인을 추가한다
  ],
}
