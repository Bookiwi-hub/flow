/**
 * @author ☯채종민
 * @description 색상 처리 유틸리티 함수를 제공합니다. ARGB 색상 값을 RGB로 변환하고, 두 색상을 합성하는 기능을 포함합니다.
 * @date 2025-03-17
 */

/**
 * RGB (Red, Green, Blue)와 ARGB (Alpha, Red, Green, Blue)에 대한 설명:
 * - RGB: 빨강, 초록, 파랑의 세 가지 색상을 조합하여 색상을 표현하는 모델입니다.
 *        주로 디지털 화면에서 사용되며, 투명도는 포함하지 않습니다.
 *        예: (255, 0, 0) - 빨간색, (0, 255, 0) - 초록색, (0, 0, 255) - 파란색
 * - ARGB: RGB에 Alpha(투명도) 채널을 추가한 것으로, 색상과 함께 투명도를 표현합니다.
 *         Alpha 값은 0(완전 투명)에서 255(완전 불투명)까지의 범위를 가집니다.
 *         예: (255, 255, 0, 0) - 완전 불투명한 빨간색, (128, 0, 255, 0) - 반투명한 초록색
 *
 */

import {
  redFromArgb,
  greenFromArgb,
  blueFromArgb,
  argbFromRgb,
  hexFromArgb,
} from '@material/material-color-utilities'

/**
 * ARGB 색상 값을 RGB 채널로 분리합니다.
 * @param argb ARGB 색상 값 (정수 형태)
 * @returns [red, green, blue] 채널 값의 배열
 *
 * @example
 * // 빨간색 ARGB 값 (0xFFFF0000)을 RGB로 변환
 * const rgb = rgbFromArgb(0xFFFF0000);
 * console.log(rgb); // [255, 0, 0]
 */
export function rgbFromArgb(argb: number) {
  return [redFromArgb, greenFromArgb, blueFromArgb].map((f) => f(argb))
}

/**
 * 두 색상 채널을 주어진 비율로 합성합니다.
 * @param channel1 첫 번째 색상 채널 값 (0 ~ 255)
 * @param channel2 두 번째 색상 채널 값 (0 ~ 255)
 * @param p 합성 비율 (0 ~ 1 사이의 값)
 * @returns 합성된 채널 값
 *
 * @example
 * // 빨간색 채널(255)과 파란색 채널(0)을 0.5 비율로 합성
 * const compositeRed = compositeChannels(255, 0, 0.5);
 * console.log(compositeRed); // 127.5
 */
function compositeChannels(channel1: number, channel2: number, p: number) {
  return (1 - p) * channel1 + p * channel2
}

/**
 * 두 ARGB 색상을 주어진 비율로 합성하여 새로운 색상을 생성합니다.
 * @param color1 첫 번째 ARGB 색상 값 (정수 형태)
 * @param color2 두 번째 ARGB 색상 값 (정수 형태)
 * @param p 합성 비율 (0 ~ 1 사이의 값)
 * @returns 합성된 색상의 HEX 코드 (문자열 형태, 예: "#RRGGBB")
 *
 * @example
 * // 빨간색(0xFFFF0000)과 파란색(0xFF0000FF)을 0.5 비율로 합성
 * const compositeColor = compositeColors(0xFFFF0000, 0xFF0000FF, 0.5);
 * console.log(compositeColor); // "#800080" (보라색)
 */
export function compositeColors(color1: number, color2: number, p: number) {
  const [r1, g1, b1] = rgbFromArgb(color1) // 첫 번째 색상의 RGB 채널 추출
  const [r2, g2, b2] = rgbFromArgb(color2) // 두 번째 색상의 RGB 채널 추출
  return hexFromArgb(
    argbFromRgb(
      compositeChannels(r1!, r2!, p), // Red 채널 합성
      compositeChannels(g1!, g2!, p), // Green 채널 합성
      compositeChannels(b1!, b2!, p), // Blue 채널 합성
    ),
  )
}
