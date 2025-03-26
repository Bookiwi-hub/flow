/**
 * @author 조현지
 * @description 현재 환경(데스크톱/모바일)을 감지하는 훅
 * (현재 쓰이는 곳 없음)
 * @date 2025-03-21
 */

import { useMobile } from './useMobile'

/**
 * 애플리케이션 환경 타입을 정의하는 열거형이다.
 * 비트 플래그 방식으로 정의되어 있어 여러 환경을 조합할 수 있다.
 *
 * Desktop = 1 (2^0) - 데스크톱 환경을 나타낸다.
 * Mobile = 2 (2^1) - 모바일 환경을 나타낸다.
 *
 * 비트 연산자 사용으로 추후 환경 타입이 추가될 경우(예: 태블릿, TV 등)
 * 쉽게 확장할 수 있으며, 여러 환경을 조합할 수도 있다.
 */
export enum Env {
  Desktop = 1,
  Mobile = 1 << 1,
}

/**
 * 현재 실행 중인 환경(데스크톱 또는 모바일)을 감지하여 반환하는 훅이다.
 * 내부적으로 useMobile 훅을 사용하여 모바일 기기인지 여부를 판단한다.
 *
 * @returns 현재 환경에 해당하는 Env 열거형 값 (Env.Desktop 또는 Env.Mobile)
 *
 * 사용 예시:
 * ```
 * const env = useEnv();
 * if (env === Env.Mobile) {
 *   // 모바일용 UI 렌더링
 * } else {
 *   // 데스크톱용 UI 렌더링
 * }
 *
 * // 또는 비트 연산을 활용한 예시
 * if (env & Env.Mobile) {
 *   // 모바일 환경이 포함된 경우 실행
 * }
 * ```
 */
export function useEnv() {
  const mobile = useMobile()
  // useMobile 훅을 호출하여 현재 모바일 환경인지 확인한다.

  return mobile ? Env.Mobile : Env.Desktop
  // 모바일이면 Env.Mobile을 반환하고, 아니면 Env.Desktop을 반환한다.
}
