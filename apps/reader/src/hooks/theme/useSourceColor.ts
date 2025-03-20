import { useCallback } from 'react'

import { useSettings } from '@flow/reader/state'

/**
 * 테마의 기본 색상(source color)을 관리하는 훅
 *
 * Material Design 3 (Material You)의 동적 색상 시스템처럼 작동
 * 하나의 기본 색상(source color)에서 전체 테마 팔레트를 생성하는 방식
 *
 * 이 훅은 useSettings를 통해 색상을 전역 설정에 저장하여 애플리케이션 전체에서 일관된 색상 사용
 *
 * 소스 색상과 변경 함수를 포함하는 객체
 */
export function useSourceColor() {
  // useSettings: 애플리케이션 설정 상태를 관리하는 커스텀 훅
  // settings 객체에서 theme 속성만 추출하고, 설정 변경 함수도 가져옴
  const [{ theme }, setSettings] = useSettings()

  // 소스 색상 변경 함수
  // useCallback으로 메모이제이션하여 불필요한 리렌더링 방지
  // 종속성 배열에 setSettings만 포함하여 이 함수가 변경될 때만 재생성
  const setSourceColor = useCallback(
    (source: string) => {
      // 함수형 업데이트 패턴 사용
      // 이전 상태(prev)를 기반으로 새 상태 계산
      // 전체 설정 객체를 유지하면서 theme.source만 업데이트
      setSettings((prev) => ({
        ...prev, // 기존 설정 유지
        theme: {
          ...prev.theme, // 기존 테마 설정 유지
          source, // 소스 색상만 업데이트
        },
      }))
    },
    [setSettings], // setSettings가 변경될 때만 함수 재생성
  )

  // 현재 소스 색상 반환
  // theme?.source가 없으면 기본값 '#0ea5e9' (하늘색) 사용
  return { sourceColor: theme?.source ?? '#0ea5e9', setSourceColor }
}
