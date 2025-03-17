import { useMediaQuery } from '@literal-ui/hooks'
import { useEffect } from 'react'
import useLocalStorageState from 'use-local-storage-state'

// 컬러 스킴 타입 정의: 라이트, 다크, 시스템 설정 따르기
// TypeScript의 유니온 타입을 사용하여 가능한 값들을 제한함
export type ColorScheme = 'light' | 'dark' | 'system'

/**
 * 애플리케이션의 컬러(라이트/다크 모드)을 관리하는 훅
 *
 * 1. 사용자 선택을 로컬 스토리지에 저장하여 새로고침 후에도 설정 유지
 * 2. 시스템 설정 감지 (prefers-color-scheme 미디어 쿼리 활용)
 * 3. 다크 모드 토글 기능 (HTML 요소에 'dark' 클래스 추가/제거)
 *
 *  현재 컬러 스킴 상태와 변경 함수
 */
export function useColorScheme() {
  // useLocalStorageState: React 상태와 로컬 스토리지를 동기화하는 훅 라이브러리
  // 'literal-color-scheme' 키로 로컬 스토리지에 저장됨
  // 기본값은 'system'으로 설정 - 초기 로드 시 시스템 설정 따름
  const [scheme, setScheme] = useLocalStorageState<ColorScheme>(
    'literal-color-scheme',
    { defaultValue: 'system' },
  )

  // useMediaQuery: CSS 미디어 쿼리 결과를 React 상태로 제공하는 훅
  // 이 쿼리는 사용자의 시스템이 다크 모드인지 감지함
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  // 실제 적용할 모드 결정 로직
  // 1. 'dark'가 명시적으로 선택된 경우 무조건 다크 모드
  // 2. 'system'이 선택되고 시스템이 다크 모드인 경우 다크 모드
  // 3. 그 외의 경우 (light 또는 system+light system) 라이트 모드
  const dark = scheme === 'dark' || (scheme === 'system' && prefersDark)

  // 다크 모드 설정이 변경될 때마다 HTML 요소에 'dark' 클래스 토글
  // 이 클래스는 CSS에서 .dark 선택자를 통해 다크 모드 스타일 적용에 사용됨
  // Tailwind CSS의 다크 모드 기능과 연동되어 작동
  useEffect(() => {
    if (dark !== undefined) {
      document.documentElement.classList.toggle('dark', dark)
    }
  }, [dark]) // dark 값이 변경될 때만 이펙트 실행

  // 외부 컴포넌트에서 사용할 수 있도록 관련 값과 함수 반환
  return { scheme, dark, setScheme }
}
