/**
 * @author 조현지
 * @description Sentry 브라우저 측 초기화 설정 파일
 * @date 2025-03-16
 */

// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs' // Sentry의 Next.js 패키지를 가져온다.

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN // 환경 변수에서 Sentry DSN 값을 가져온다.

Sentry.init({
  dsn:
    SENTRY_DSN ||
    'https://911830b959464866b3820e27379f4d38@o955619.ingest.sentry.io/6537954', // 환경 변수에 DSN이 없을 경우 기본값을 사용한다.
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0, // 추적 샘플링 비율을 100%로 설정한다. (프로덕션에서는 조정이 필요하다)
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  // 릴리스 값을 재정의하려면 여기서 설정하지 말고 SENTRY_RELEASE 환경 변수를 사용해야 소스맵에도 적용된다.
})
