/**
 * @author ☯채종민
 * @description 터치스크린인지 확인하고, 터치스크린 여부에 따라 값을 조정.
 * @date 2025-03-21
 */

/**
 * - `isTouchScreen`: 터치스크린 지원 여부를 감지.
 * - `scale`: 터치스크린이면 특정 값을, 아니면 기본 값을 반환.
 *
 * 역할:
 * - 터치스크린 디바이스와 비터치 디바이스(예: 데스크톱) 간 동작 차별화.
 * - 서버 측 렌더링(SSR) 환경에서 클라이언트 특성 감지 비활성화.
 *
 * 참고: 터치스크린 감지 로직은 GeeksforGeeks의 방법을 기반으로 함
 * (https://www.geeksforgeeks.org/how-to-detect-touch-screen-device-using-javascript).
 *
 * 사용 예시:
 * const buttonSize = scale(16, 24); // 터치스크린이면 24, 아니면 16 반환
 */

// 서버 여부를 확인하는 플래그 가져오기 (SSR에서는 클라이언트 특성 감지 불가)
// export const IS_SERVER = typeof window === 'undefined'
import { IS_SERVER } from '@literal-ui/hooks'

// 터치스크린 지원 여부를 감지하는 상수
// - IS_SERVER가 true면 false (서버 환경에서는 터치 감지 불가)
// - 클라이언트 환경에서는 'ontouchstart' 이벤트 지원 여부로 터치스크린 확인
export const isTouchScreen = IS_SERVER ? false : 'ontouchstart' in window

// 값을 터치스크린 여부에 따라 조정하는 함수
// - value: 비터치 디바이스에서 사용할 기본 값
// - valueInTouchScreen: 터치스크린 디바이스에서 사용할 값
// - 반환: isTouchScreen이 true면 valueInTouchScreen, 아니면 value
/**
 * 값을 터치스크린 여부에 따라 조정하는 함수
 * @param {number} value - 비터치 디바이스에서 사용할 기본 값
 * @param {number} valueInTouchScreen - 터치스크린 디바이스에서 사용할 값
 * @returns {number} isTouchScreen ? valueInTouchScreen : value
 *
 * @example
 * <div style={{ fontSize: scale(11, 12) }} />
 *
 */
export const scale = (value: number, valueInTouchScreen: number) =>
  isTouchScreen ? valueInTouchScreen : value
