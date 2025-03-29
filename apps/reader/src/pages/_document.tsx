/**
 * @author ☯채종민
 * @description
 * @date 2025-03-25
 */

import { Html, Head, Main, NextScript } from 'next/document'

/**
 * Document 컴포넌트는 Next.js 애플리케이션의 HTML 문서 구조를 정의합니다.
 * 서버 측에서만 렌더링되며, 클라이언트 측 이벤트 핸들러는 사용할 수 없습니다.
 * @returns {JSX.Element} 커스터마이징된 HTML 문서 구조
 */
export default function Document() {
  return (
    <Html className="bg-default">
      <Head>
        {/* Google Tag Manager 스크립트를 삽입하여 애널리틱스를 활성화합니다. */}
        <GoogleTagManager />
        {/* 브라우저 탭에 표시될 파비콘을 설정합니다. */}
        <link rel="icon" href="/icons/192.png"></link>
        {/* PWA(Progressive Web App) 설정을 위한 메타 태그와 링크를 추가합니다. */}
        <PWA />
        {/* 다크 모드와 라이트 모드 전환 시 깜빡임을 방지하는 스타일과 스크립트를 삽입합니다. */}
        <PreventFlash />
      </Head>
      <body>
        {/* Google Tag Manager의 noscript 태그를 삽입하여 스크립트 비활성화 시에도 동작하도록 합니다. */}
        {/* JavaScript가 꺼진 사용자도 추적하여 더 정확한 통계를 제공합니다. */}
        <GoogleTagManagerNoScript />
        {/* Next.js 애플리케이션의 주요 콘텐츠를 렌더링합니다. */}
        <Main />
        {/* Next.js의 필수 스크립트(예: 페이지 로딩, 클라이언트 측 라우팅)를 삽입합니다. */}
        <NextScript />
      </body>
    </Html>
  )
}

/**
 * PWA 컴포넌트는 Progressive Web App 설정을 위한 메타 태그와 링크를 제공합니다.
 * - `manifest.json`: PWA의 이름, 아이콘, 색상, 실행 방식을 정의하여 네이티브 앱처럼 동작하게 만듭니다.
 * - Android는 `manifest.json`의 아이콘을 사용하지만, iOS는 `<link rel="apple-touch-icon">` 태그가 필요합니다.
 * @returns {JSX.Element} PWA 관련 태그를 포함한 JSX 요소
 */
function PWA() {
  return (
    <>
      {/* 웹 애플리케이션 매니페스트 파일을 연결하여 PWA 속성을 정의합니다. */}
      <link rel="manifest" href="/manifest.json" />
      {/* 브라우저의 테마 색상을 설정하며, 초기값은 라이트 모드 배경색으로 지정됩니다. */}
      <meta id="theme-color" name="theme-color" content={background.light} />
      {/* iOS 기기에서 PWA 설치 시 사용할 아이콘을 설정합니다. Android는 manifest.json의 아이콘을 사용합니다. */}
      <link rel="apple-touch-icon" href="/icons/192.png" />
    </>
  )
}

// Google Tag Manager ID를 환경 변수에서 가져옵니다.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

/**
 * GoogleTagManager 컴포넌트는 Google Tag Manager 스크립트를 <head>에 삽입합니다.
 * @returns {JSX.Element | null} GTM 스크립트를 포함한 JSX 요소 또는 GTM_ID가 없으면 null
 */
function GoogleTagManager() {
  // GTM_ID가 없으면 스크립트를 삽입하지 않습니다.
  if (!GTM_ID) return null
  return (
    // Next.js의 기본 GA 스크립트 규칙을 무시하고 직접 삽입합니다.
    // eslint-disable-next-line @next/next/next-script-for-ga
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer', '${GTM_ID}');
          `,
      }}
    />
  )
}

/**
 * GoogleTagManagerNoScript 컴포넌트는 Google Tag Manager의 noscript 태그를 <body>에 삽입합니다.
 * - `<noscript>`는 JavaScript가 비활성화된 환경에서도 GTM이 추적 데이터를 수집할 수 있도록 iframe을 사용합니다.
 * - JavaScript가 꺼진 사용자도 추적하여 더 정확한 통계를 제공합니다.
 * @returns {JSX.Element | null} GTM noscript 태그를 포함한 JSX 요소 또는 GTM_ID가 없으면 null
 */
function GoogleTagManagerNoScript() {
  // GTM_ID가 없으면 noscript 태그를 삽입하지 않습니다.
  if (!GTM_ID) return null
  return (
    <noscript>
      {/* GTM iframe을 통해 스크립트 없이도 추적 기능을 제공합니다. */}
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      ></iframe>
    </noscript>
  )
}

// 라이트 모드와 다크 모드의 배경색을 정의합니다.
const background = {
  light: 'white',
  dark: '#24292e',
}

/**
 * PreventFlash 컴포넌트는 다크 모드와 라이트 모드 전환 시 깜빡임을 방지합니다.
 * - 초기 렌더링 시 사용자의 테마 선호도(로컬 스토리지 또는 시스템 설정)에 따라 올바른 스타일을 적용합니다.
 * - `dangerouslySetInnerHTML`을 사용하여 `<script>` 태그에 클라이언트 측에서 즉시 실행되는 JavaScript 코드를 삽입하며,
 *   이는 외부 import가 빠른 새로고침(fast refresh)을 방해하기 때문에 여기서 직접 구현됩니다.
 * - 목적: 페이지 로드 시 테마 전환으로 인한 깜빡임(FOUC)을 방지하고 사용자 경험을 개선합니다.
 * @returns {JSX.Element} 스타일과 스크립트를 포함한 JSX 요소
 */
function PreventFlash() {
  // setColorScheme 함수는 클라이언트 측에서 테마를 설정합니다.
  const setColorScheme = () => {
    // 시스템의 다크 모드 선호 여부를 확인합니다.
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    // 로컬 스토리지에서 사용자 테마 설정을 가져오며, 기본값은 'system'입니다.
    const scheme = localStorage.getItem('literal-color-scheme') ?? 'system'

    // 다크 모드 조건: 사용자가 'dark'를 선택했거나, 'system'이고 시스템이 다크 모드일 때
    if (scheme === '"dark"' || (scheme === '"system"' && mql.matches)) {
      // HTML 요소에 'dark' 클래스를 추가하여 다크 모드 스타일을 적용합니다.
      document.documentElement.classList.toggle('dark', true)
      // 테마 색상을 다크 모드 배경색으로 업데이트합니다.
      document
        .querySelector('#theme-color')
        ?.setAttribute('content', background.dark)
    }
  }

  return (
    <>
      {/* 배경색을 정의하는 CSS 스타일을 삽입합니다. */}
      <style>{`
        .bg-default, .hover\\:bg-default:hover {
          background: ${background.light};
        }
        .dark.bg-default, .dark .bg-default, .dark .hover\\:bg-default:hover {
          background: ${background.dark};
        }
      `}</style>
      {/* background 객체를 클라이언트 측에서 사용할 수 있도록 JSON 형태로 삽입합니다. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `const background=${JSON.stringify(background)}`,
        }}
      ></script>
      {/* setColorScheme 함수를 즉시 실행하여 초기 테마를 설정합니다. */}
      <script
        dangerouslySetInnerHTML={{ __html: `(${setColorScheme})()` }}
      ></script>
    </>
  )
}
