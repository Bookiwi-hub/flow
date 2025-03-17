import { useCallback, useEffect, useMemo } from 'react'

import { compositeColors } from '@flow/reader/color'
import { useSettings } from '@flow/reader/state'

import { useColorScheme } from './useColorScheme'
import { useTheme } from './useTheme'

/**
 * 애플리케이션의 배경색을 관리하는 훅
 *
 * - 다양한 표면에 기본 색상을 다른 강도로 적용
 * - 레벨이 높을수록 기본 색상의 영향을 더 많이 받음(더 진한 색조)
 *
 * 다크/라이트 모드에 따라 적절한 배경색 제공 및
 * 모바일 브라우저 상태 표시줄 색상(theme-color)도 동기화
 *
 * @returns {[string, function]} 배경색 CSS 클래스명과 배경색 레벨 설정 함수
 */
export function useBackground() {
  // 전역 설정에서 테마 설정 가져오기
  // theme 객체에서 background 속성으로 현재 레벨 확인 가능
  const [{ theme }, setSettings] = useSettings()

  // 현재 다크 모드 상태 가져오기
  // dark: 현재 다크 모드 적용 여부를 나타내는 boolean 값
  const { dark } = useColorScheme()

  // Material Design 3 테마 객체 가져오기
  // 색상 계산에 필요한 팔레트 정보 포함됨
  const rawTheme = useTheme()

  /**
   * 배경색 레벨 설정 함수
   *
   * useCallback으로 메모이제이션하여 불필요한 리렌더링 방지
   * 설정은 useSettings 훅을 통해 전역 상태에 저장됨
   */
  const setBackground = useCallback(
    (background: number) => {
      // 함수형 업데이트로 이전 상태 기반 새 상태 계산
      setSettings((prev) => ({
        ...prev, // 기존 설정 유지
        theme: {
          ...prev.theme, // 기존 테마 설정 유지
          background, // 배경 레벨만 업데이트
        },
      }))
    },
    [setSettings], // setSettings가 변경될 때만 함수 재생성
  )

  // 현재 배경 레벨 (기본값: -1 = 기본 배경)
  // theme?.background가 없으면 -1 사용
  const level = theme?.background ?? -1

  /**
   * 현재 설정에 따른 배경색 CSS 클래스명 계산
   *
   * useMemo로 메모이제이션하여 불필요한 재계산 방지
   * Tailwind CSS 클래스명 규칙 사용
   *
   * - 다크 모드: 항상 'bg-default' 사용 (다크 모드에서는 레벨 무시)
   * - 라이트 모드 + 레벨 > 0: 레벨에 따른 표면색 사용 ('bg-surface1', 'bg-surface3' 등)
   * - 그 외: 기본 배경색 사용 ('bg-default')
   */
  const background = useMemo(() => {
    if (dark) return 'bg-default'

    if (level > 0) return `bg-surface${level}`

    return 'bg-default'
  }, [dark, level]) // dark 또는 level이 변경될 때만 재계산

  /**
   * 모바일 브라우저 상태 표시줄 색상(theme-color) 설정
   *
   * Material Design 3 색상 시스템에 따라 레벨별 색상 계산
   * compositeColors 함수를 사용해 표면색과 기본색을 특정 비율로 혼합
   */
  useEffect(() => {
    // 필수 값이 없으면 실행 중단
    if (dark === undefined) return
    if (rawTheme === undefined) return

    // 각 레벨별 기본색과 표면색의 혼합 비율 정의
    // Material Design 3 표면 레벨 가이드라인 기반
    const surfaceMap: Record<number, number> = {
      1: 0.05, // 5% 기본색 + 95% 표면색
      2: 0.08, // 8% 기본색 + 92% 표면색
      3: 0.11, // 11% 기본색 + 89% 표면색
      4: 0.12, // 12% 기본색 + 88% 표면색
      5: 0.14, // 14% 기본색 + 86% 표면색
    }

    // Material Design 3 테마에서 표면색과 기본색 가져오기
    const { surface, primary } = rawTheme.schemes.light

    // 최종 색상 계산
    const color = dark
      ? '#24292e' // 다크 모드
      : level < 0
      ? '#fff' // 기본 배경 - 흰색
      : compositeColors(surface, primary, surfaceMap[level]!) // 레벨에 따른 혼합색

    // 모바일 브라우저 상태 표시줄 색상 설정
    // HTML meta 태그의 content 속성 변경
    document.querySelector('#theme-color')?.setAttribute('content', color)
  }, [dark, level, rawTheme]) // 의존성 배열: 관련 값이 변경될 때만 실행

  // 튜플 반환: [CSS 클래스명, 레벨 설정 함수]
  // as const: TypeScript에게 정확한 타입 정보 제공 (readonly 튜플)
  return [background, setBackground] as const
}
