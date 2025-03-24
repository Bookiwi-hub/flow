/**
 * @author 조현지
 * @description Next.js 설정 파일
 * @date 2025-03-16
 */

const path = require('path') // path 모듈을 가져온다.

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true', // ANALYZE 환경변수가 'true'일 때만 번들 분석기를 활성화한다.
})
const { withSentryConfig } = require('@sentry/nextjs') // Sentry Next.js 설정 함수를 가져온다.
const withPWA = require('next-pwa')({
  dest: 'public', // PWA 관련 파일을 public 디렉토리에 생성한다.
})
const withTM = require('next-transpile-modules')([
  '@flow/internal',
  '@flow/epubjs',
  '@material/material-color-utilities',
]) // 지정된 노드 모듈을 Next.js에서 트랜스파일하도록 설정한다.

const IS_DEV = process.env.NODE_ENV === 'development' // 개발 환경인지 확인한다.
const IS_DOCKER = process.env.DOCKER // Docker 환경인지 확인한다.

/**
 * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
 **/
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // 모든 로그 출력을 억제한다.
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  pageExtensions: ['ts', 'tsx'], // 페이지로 인식할 파일 확장자를 지정한다.
  webpack(config) {
    return config // 웹팩 설정을 변경 없이 그대로 반환한다.
  },
  i18n: {
    locales: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'], // 지원할 언어 목록을 정의한다.
    defaultLocale: 'en-US', // 기본 언어를 영어로 설정한다.
  },
  ...(IS_DOCKER && {
    output: 'standalone', // Docker 환경에서는 독립 실행형 출력을 사용한다.
    experimental: {
      outputFileTracingRoot: path.join(__dirname, '../../'), // 파일 추적 루트 경로를 설정한다.
    },
  }),
}

const base = withPWA(withTM(withBundleAnalyzer(config))) // 기본 설정에 번들 분석기, 모듈 트랜스파일, PWA 기능을 적용한다.

const dev = base // 개발 환경 설정.
const docker = base // Docker 환경 설정.
const prod = withSentryConfig(
  base,
  // Make sure adding Sentry options is the last code to run before exporting, to
  // ensure that your source maps include changes from all other Webpack plugins
  sentryWebpackPluginOptions,
) // 프로덕션 환경에는 Sentry 설정도 추가한다.

module.exports = IS_DEV ? dev : IS_DOCKER ? docker : prod // 환경에 따라 적절한 설정을 내보낸다.
