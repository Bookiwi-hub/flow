/**
 * @author ☯채종민
 * @description Material Design 3 테마 시스템을 구현하는 컴포넌트
 * 사용자가 선택한 소스 색상을 기반으로 전체 애플리케이션의 테마를 생성하고 적용합니다.
 */

// Material Design 3의 색상 유틸리티 함수들을 가져옵니다
import {
  themeFromSourceColor, // 소스 색상으로부터 전체 테마를 생성하는 함수
  argbFromHex, // 16진수 색상 코드를 ARGB 형식으로 변환하는 함수
  Theme as MaterialTheme, // Material Design 테마 타입 (이름 충돌 방지를 위해 별칭 사용)
} from '@material/material-color-utilities'
import Head from 'next/head' // Next.js의 Head 컴포넌트
import { useEffect, useMemo } from 'react' // React 훅

import { range } from '@flow/internal' // 범위 생성 유틸리티

import { rgbFromArgb } from '../color' // ARGB를 RGB로 변환하는 유틸리티 함수
import { useSetTheme, useSourceColor } from '../hooks' // 테마 관련 커스텀 훅

// Tailwind CSS가 생성해야 할 클래스 목록
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const classNamesToGenerate = [
  'bg-surface', // 기본 표면 배경색
  'bg-surface1', // 표면 레벨 1 배경색
  'bg-surface2', // 표면 레벨 2 배경색
  'bg-surface3', // 표면 레벨 3 배경색
  'bg-surface4', // 표면 레벨 4 배경색
  'bg-surface5', // 표면 레벨 5 배경색
  'hover:bg-surface', // 호버 시 기본 표면 배경색
  'hover:bg-surface1', // 호버 시 표면 레벨 1 배경색
  'hover:bg-surface2', // 호버 시 표면 레벨 2 배경색
  'hover:bg-surface3', // 호버 시 표면 레벨 3 배경색
  'hover:bg-surface4', // 호버 시 표면 레벨 4 배경색
  'hover:bg-surface5', // 호버 시 표면 레벨 5 배경색
]

/**
 * camelCase 문자열을 snake_case로 변환하는 유틸리티 함수
 * @param s 변환할 camelCase 문자열
 * @returns snake_case로 변환된 문자열
 *
 * @example
 * - 'primaryColor' -> 'primary-color'
 * - 'backgroundColor' -> 'background-color'
 */
function camelToSnake(s: string) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Material Design 테마로부터 CSS 변수를 생성하는 함수
 * @param theme Material Design 테마 객체
 * @returns CSS 변수를 포함하는 문자열
 *
 * @example
 * :root {
 *   --md-ref-palette-primary50: 236 233 253;
 *   --md-ref-palette-primary60: 210 189 255;
 *   --md-ref-palette-primary70: 179 157 255;
 *   --md-ref-palette-primary80: 147 51 234;
 *   --md-ref-palette-secondary50: 236 233 253;
 *   ...
 * }
 */
function generateCss(theme: MaterialTheme) {
  // 색상 톤 레벨 (50, 60, 70, 80)
  const tones = range(4).map((i) => (i + 5) * 10)

  /**
   * 팔레트 참조 색상을 CSS 변수로 생성하는 함수
   * @returns 팔레트 참조 색상 CSS 변수 문자열
   *
   * @example
   * --md-ref-palette-primary50: 236 233 253;
   * --md-ref-palette-primary60: 210 189 255;
   * --md-ref-palette-primary70: 179 157 255;
   * --md-ref-palette-primary80: 147 51 234;
   */
  const generateRef = () => {
    return Object.entries(theme.palettes)
      .flatMap(([k, palette]) =>
        tones.map((i) => {
          const argb = palette.tone(i) // 특정 톤의 ARGB 색상값 가져오기
          const rgb = rgbFromArgb(argb).join(' ') // ARGB를 RGB로 변환
          return `--md-ref-palette-${camelToSnake(k)}${i}:${rgb};` // CSS 변수 생성
        }),
      )
      .join('')
  }

  /**
   * 시스템 색상 스키마를 CSS 변수로 생성하는 함수
   * @param schemeName 'light' 또는 'dark' 스키마 이름
   * @returns 시스템 색상 스키마 CSS 변수 문자열
   *
   * @example
   * (라이트)
   * --md-sys-color-primary: 147 51 234;
   * --md-sys-color-on-primary: 255 255 255;
   * --md-sys-color-surface: 255 255 255;
   * --md-sys-color-on-surface: 28 27 31;
   *
   * @example
   * (다크)
   * --md-sys-color-primary: 210 189 255;
   * --md-sys-color-on-primary: 28 27 31;
   * --md-sys-color-surface: 28 27 31;
   * --md-sys-color-on-surface: 229 225 230;
   */
  const generateSys = (schemeName: 'light' | 'dark') => {
    let css = `color-scheme: ${schemeName};` // 색상 스키마 설정
    const scheme = theme.schemes[schemeName] // 해당 스키마의 색상 정보 가져오기
    Object.entries(scheme.toJSON()).forEach(([key, argb]) => {
      const token = camelToSnake(key) // 키를 snake_case로 변환
      const rgb = rgbFromArgb(argb).join(' ') // ARGB를 RGB로 변환
      css += `--md-sys-color-${token}:${rgb};` // 시스템 색상 CSS 변수 생성
    })
    return css
  }

  // 루트 요소와 라이트/다크 모드에 대한 CSS 변수 생성
  return (
    `:root {${generateRef()}}` + // 기본 팔레트 참조 색상
    `:root, .light {${generateSys('light')}}` + // 라이트 모드 시스템 색상
    `:root.dark {${generateSys('dark')}}` // 다크 모드 시스템 색상
  )
}

/**
 * Theme 컴포넌트
 * Material Design 3 테마를 생성하고 적용하는 메인 컴포넌트
 */
export function Theme() {
  const { sourceColor } = useSourceColor() // 소스 색상 가져오기
  const setTheme = useSetTheme() // 테마 설정 함수

  // 소스 색상으로부터 Material Design 테마 생성
  const theme = useMemo(
    () => themeFromSourceColor(argbFromHex(sourceColor)),
    [sourceColor],
  )

  // 테마가 변경될 때마다 테마 설정 업데이트
  useEffect(() => {
    setTheme(theme)
  }, [setTheme, theme])

  // CSS 변수를 포함하는 style 태그를 head에 추가
  return (
    <Head>
      <style
        id="theme"
        dangerouslySetInnerHTML={{ __html: generateCss(theme) }}
      ></style>
    </Head>
  )
}
