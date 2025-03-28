/**
 * @author ☯채종민
 * @description  Next.js 애플리케이션의 커스텀 에러 페이지. Sentry와 통합되어 애플리케이션 에러를 추적하고 보고
 * @date 2025-03-26
 */

/**
 * NOTE: 이 코드는 `@sentry/nextjs` 버전 7.3.0 이상이 필요합니다.
 *
 * NOTE: Next.js 버전 12.2.0 이하를 사용하는 경우, `CustomErrorComponent` 내의
 * 주석 처리된 라인의 주석을 해제해야 합니다.
 *
 * 이 페이지는 다음과 같은 상황에서 Next.js에 의해 로드됩니다:
 *  - 서버에서 데이터 패칭 메소드가 에러를 던지거나 거부될 때
 *  - 클라이언트에서 `getInitialProps`가 에러를 던지거나 거부될 때
 *  - 클라이언트에서 React 생명주기 메소드가 에러를 던지고, Next.js의 내장 에러 경계에 의해 잡힐 때
 *
 * 참조:
 *  - https://nextjs.org/docs/basic-features/data-fetching/overview
 *  - https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
 *  - https://reactjs.org/docs/error-boundaries.html
 */

// Sentry 라이브러리를 가져옵니다.
import * as Sentry from '@sentry/nextjs'
// Next.js의 기본 에러 컴포넌트를 가져옵니다.
import NextErrorComponent from 'next/error'

// 커스텀 에러 컴포넌트를 정의합니다.
const CustomErrorComponent = (props) => {
  // Next.js 버전 12.2.1 이전 버전을 사용 중이라면, 아래 주석을 해제하세요.
  // 이는 https://github.com/vercel/next.js/issues/8592 이슈를 보완하기 위한 것입니다.
  // Sentry.captureUnderscoreErrorException(props);

  // Next.js의 기본 에러 컴포넌트를 반환하며, 상태 코드를 전달합니다.
  return <NextErrorComponent statusCode={props.statusCode} />
}

// getInitialProps는 Next.js의 데이터 페칭 메소드로, 페이지가 로드되기 전에 실행됩니다.
CustomErrorComponent.getInitialProps = async (contextData) => {
  // 서버리스 함수에서 실행 중일 경우, 람다가 종료되기 전에 Sentry가 에러를 전송할 시간을 확보하기 위해 await을 사용합니다.
  await Sentry.captureUnderscoreErrorException(contextData)

  // 기본 에러 컴포넌트의 getInitialProps를 호출하여 상태 코드를 포함한 데이터를 가져옵니다.
  return NextErrorComponent.getInitialProps(contextData)
}

// 커스텀 에러 컴포넌트를 내보냅니다. 이 컴포넌트는 애플리케이션에서 에러가 발생했을 때 렌더링됩니다.
export default CustomErrorComponent
