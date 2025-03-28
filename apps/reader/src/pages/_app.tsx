/**
 * @author ☯채종민
 * @description
 * @date 2025-03-21
 */

// 전역 스타일을 가져옵니다. './styles.css'는 프로젝트 내 사용자 정의 스타일 파일입니다.
import './styles.css'
// photo 관련되어서 react-photo-view 라이브러리를 사용함, react-photo-view 스타일을 여기서 전체 적용함.
import 'react-photo-view/dist/react-photo-view.css'

// 내비게이션 상태를 관리하는 context provider.
import { LiteralProvider } from '@literal-ui/core'
// Sentry의 오류 경계 컴포넌트를 가져옵니다. 오류를 감지하고 대체 UI를 표시합니다.
import { ErrorBoundary } from '@sentry/nextjs'
// Next.js에서 제공하는 AppProps 타입을 가져옵니다. MyApp 함수의 props 타입을 정의합니다.
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { RecoilRoot } from 'recoil'

import { Theme, Layout } from '../components'

// MyApp 함수는 Next.js의 기본 App 컴포넌트를 커스터마이징하여 모든 페이지에 공통 로직을 적용합니다.
export default function MyApp({ Component, pageProps }: AppProps) {
  // useRouter 훅을 사용해 현재 경로 정보를 가져옵니다.
  const router = useRouter()

  // 현재 경로가 '/success'일 경우, 추가 설정 없이 페이지 컴포넌트만 렌더링합니다.
  if (router.pathname === '/success') return <Component {...pageProps} />

  // '/success'가 아닌 경우, 전체 레이아웃과 설정을 적용해 페이지를 렌더링합니다.
  return (
    // ErrorBoundary로 감싸 오류를 감지하고, 오류 발생 시 Fallback 컴포넌트를 표시합니다.
    <ErrorBoundary fallback={<Fallback />}>
      {
        // 내비게이션 상태를 관리하는 context. 근데 사용하지는 않는 것 같다.
      }
      <LiteralProvider>
        {
          // RecoilRoot로 Recoil 상태 관리를 활성화.
        }
        <RecoilRoot>
          {
            // Theme 컴포넌트로 테마 설정을 적용.
          }
          <Theme />
          {
            // Layout 컴포넌트로 공통 레이아웃을 제공.
          }
          <Layout>
            {
              // 현재 페이지 컴포넌트를 렌더링하며, pageProps를 전달합니다.
            }
            <Component {...pageProps} />
          </Layout>
        </RecoilRoot>
      </LiteralProvider>
    </ErrorBoundary>
  )
}

// Fallback 컴포넌트는 오류 발생 시 사용자에게 표시될 대체 UI입니다.
const Fallback: React.FC = () => {
  return <div>Something went wrong.</div>
}
