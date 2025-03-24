/**
 * @author ☯채종민
 * @description EPUB 리더에서 스타일을 관리하고 동적으로 적용하기 위한 유틸리티 함수와 상수를 정의하는 모듈.
 *  기본 스타일 설정, 사용자 설정에 따른 동적 CSS 생성,
 *  그리고 반응형 디자인 지원
 * @date 2025-03-21
 */

import { CSSProperties } from 'react'

import { Contents } from '@flow/epubjs'

import { Settings } from './state'
import { keys } from './utils'

// 활성화된 요소(예: 선택된 항목)에 적용할 CSS 클래스 이름입니다.
export const activeClass = 'bg-primary70'

// EPUB 문서의 기본 스타일을 정의합니다.
export const defaultStyle = {
  html: {
    padding: '0 !important', // HTML 요소의 패딩을 0으로 강제 설정
  },
  body: {
    background: 'transparent', // body 배경을 투명하게 설정
  },
  'a:any-link': {
    color: '#3b82f6 !important', // 모든 링크의 색상을 파란색(#3b82f6)으로 설정
    'text-decoration': 'none !important', // 링크의 밑줄을 제거
  },
  '::selection': {
    'background-color': 'rgba(3, 102, 214, 0.2)', // 텍스트 선택 시 배경색을 반투명 파란색으로 설정
  },
}

/**
 * camelCase를 kebab-case로 변환하는 함수
 * @param {string} str - 변환할 camelCase 문자열
 * @return {string} - kebab-case로 변환된 문자열
 * @example
 * camelToSnake('fontSize') // 'font-size'
 */
const camelToSnake = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/**
 * CSSProperties 객체를 CSS 문자열로 변환하는 함수
 * @param {CSSProperties} o - CSS 속성을 포함한 객체
 * @return {string} - CSS 문자열
 * @example
 * mapToCss({ fontSize: '16px', color: 'red' })
 * // 'font-size: 16px !important;\ncolor: red !important;'
 */
function mapToCss(o: CSSProperties) {
  return keys(o)
    .filter((k) => o[k] !== undefined)
    .map((k) => `${camelToSnake(k)}: ${o[k]} !important;`)
    .join('\n')
}

// 커스텀 스타일을 식별하기 위한 열거형
enum Style {
  Custom = 'custom', // 커스텀 스타일의 고유 식별자
}

/**
 * 사용자 설정에 따라 동적으로 스타일을 업데이트하는 함수
 * 이 함수는 EPUB 문서에 사용자 설정을 반영한 CSS를 생성하고 적용합니다.
 * contents.addStylesheetCss는 Promise<boolean>을 반환하며, 스타일 적용 성공 여부를 나타냅니다.
 *
 * @param {Contents | undefined} contents - EPUB 문서의 내용 객체
 * @param {Settings | undefined} settings - 사용자 설정 데이터
 * @return {Promise<boolean> | void} - 스타일 적용 성공 여부(Promise<boolean>) 또는 void (contents/settings 없음)
 * @example
 * updateCustomStyle(contents, { fontSize: '18px', zoom: 1.2 })
 *   .then(success => console.log('Style applied:', success));
 */
export function updateCustomStyle(
  contents: Contents | undefined,
  settings: Settings | undefined,
) {
  if (!contents || !settings) return // contents나 settings가 없으면 함수 종료

  const { zoom, ...other } = settings // settings에서 zoom을 분리하고 나머지를 other에 저장
  let css = `a, article, cite, div, li, p, pre, span, table, body {
    ${mapToCss(other)} // other에 포함된 설정을 CSS로 변환하여 적용
  }`

  if (zoom) {
    // zoom 설정이 있을 경우
    // EPUB 문서의 body 요소를 가져옴
    // contents.content는 EPUB 문서의 DOM 요소를 참조하며, 여기서는 body 태그를 가리킴
    // TypeScript에서 타입 단언(as HTMLBodyElement)을 통해 body.style 속성에 안전하게 접근
    const body = contents.content as HTMLBodyElement

    // zoom 비율에 따라 스타일 속성 값을 조정하는 함수
    // p는 CSSStyleDeclaration의 키(예: width, height 등)를 받음
    // body.style[p]에서 기존 값을 읽고, zoom으로 나누어 조정한 값을 px 단위로 반환
    // 예: zoom = 2, body.style.width = "500px"라면, { width: "250px" } 반환
    // 역할: transform: scale(zoom)으로 확대된 문서가 화면을 벗어나지 않도록 크기 보정
    const scale = (p: keyof CSSStyleDeclaration) => ({
      [p]: `${parseInt(body.style[p] as string) / zoom}px`, // zoom 비율에 따라 속성 값 조정
    })

    css += `body {
      ${mapToCss({
        transformOrigin: 'top left', // 변형 기준점을 좌상단으로 설정
        transform: `scale(${zoom})`, // zoom 값에 따라 크기 조정
        ...scale('width'), // 너비 조정
        ...scale('height'), // 높이 조정
        ...scale('columnWidth'), // 열 너비 조정
        ...scale('columnGap'), // 열 간격 조정
        ...scale('paddingTop'), // 상단 패딩 조정
        ...scale('paddingBottom'), // 하단 패딩 조정
        ...scale('paddingLeft'), // 왼쪽 패딩 조정
        ...scale('paddingRight'), // 오른쪽 패딩 조정
      })}
    }`
  }

  // 생성된 CSS를 EPUB 문서에 적용 (Style.Custom으로 식별)
  //epub.js에서 이렇게 하면 되는가 봄
  return contents.addStylesheetCss(css, Style.Custom)
}

/**
 * 반응형 디자인을 위한 유틸리티 함수
 * 이 함수는 화면 크기에 따라 값이 작은 값(l)에서 큰 값(r)로 부드럽게 변하게 만듭니다.
 * - 작은 화면(400px)에서는 l, 큰 화면(2560px)에서는 r로 설정.
 * - 목적: 버튼 크기나 간격 같은 UI 요소를 화면 크기에 맞춰 자연스럽게 조정.
 *
 * @param {number} l - 작은 화면에서 사용할 값
 * @param {number} r - 큰 화면에서 사용할 값
 * @param {string} [unit='px'] - 단위 (기본값: 'px')
 * @return {string} - CSS calc로 계산된 값 (화면 크기에 따라 변함)
 * @example
 * lock(16, 24) // 'calc(16px + 8 * (100vw - 400px) / 2160)'
 * // 400px 화면: 16px, 2560px 화면: 24px, 1480px 화면: 약 20px
 */
export function lock(l: number, r: number, unit = 'px') {
  const minw = 400 // 작은 화면 크기 기준 (400px)
  const maxw = 2560 // 큰 화면 크기 기준 (2560px)

  // calc를 사용해 화면 크기에 따라 값이 l에서 r로 부드럽게 변하게 계산
  return `calc(${l}${unit} + ${r - l} * (100vw - ${minw}px) / ${maxw - minw})`
}
