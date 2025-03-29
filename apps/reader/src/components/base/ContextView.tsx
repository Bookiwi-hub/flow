// https://github.com/microsoft/vscode/blob/36fdf6b697cba431beb6e391b5a8c5f3606975a1/src/vs/base/browser/ui/contextview/contextview.ts

/**
 * @author ☯채종민
 * @description 뷰 위치 계산 로직 -  text selection 하고 뜨는 모달 위치 계산하는 로직
 * @see https://github.com/microsoft/vscode/blob/36fdf6b697cba431beb6e391b5a8c5f3606975a1/src/vs/base/browser/ui/contextview/contextview.ts
 * @date 2025-03-28
 * @example
 *
 */

/**
 * 앵커를 기준으로 한 컨텍스트 뷰의 위치를 정의하는 열거형
 * @enum {number}
 */
export const enum LayoutAnchorPosition {
  /** 앵커 이전에 컨텍스트 뷰를 배치 */
  Before,
  /** 앵커 이후에 컨텍스트 뷰를 배치 */
  After,
}

/**
 * 앵커와 컨텍스트 뷰의 정렬 모드를 정의하는 열거형
 * @enum {number}
 */
export enum LayoutAnchorMode {
  /** 앵커를 피해서 컨텍스트 뷰를 배치 */
  AVOID,
  /** 앵커에 맞춰서 컨텍스트 뷰를 배치 */
  ALIGN,
}

/**
 * 앵커의 위치와 크기 정보를 정의하는 인터페이스
 * @interface ILayoutAnchor
 * @property {number} offset - 앵커의 시작 위치
 * @property {number} size - 앵커의 크기
 * @property {LayoutAnchorMode} [mode] - 앵커와의 정렬 모드
 * @property {LayoutAnchorPosition} position - 선호하는 앵커 위치
 */
interface ILayoutAnchor {
  offset: number
  size: number
  mode?: LayoutAnchorMode
  /** preferred anchor position */
  position: LayoutAnchorPosition
}

/**
 * 뷰포트 내에서 앵커를 기준으로 컨텍스트 뷰의 위치를 계산하는 함수
 * {@link ./ContextView.excalidraw} 다이어그램 참조
 *
 * @param {number} viewportSize - 뷰포트의 전체 크기
 * @param {number} viewSize - 컨텍스트 뷰의 크기
 * @param {ILayoutAnchor} anchor - 앵커의 위치와 크기 정보
 * @returns {number} 뷰포트 내에서의 컨텍스트 뷰의 오프셋 위치
 */
export function layout(
  viewportSize: number,
  viewSize: number,
  anchor: ILayoutAnchor,
) {
  // ALIGN 모드일 때는 앵커의 시작점/끝점을 기준으로,
  // AVOID 모드일 때는 앵커의 끝점/시작점을 기준으로 경계를 설정
  const layoutAfterAnchorBoundary =
    anchor.mode === LayoutAnchorMode.ALIGN
      ? anchor.offset
      : anchor.offset + anchor.size
  const layoutBeforeAnchorBoundary =
    anchor.mode === LayoutAnchorMode.ALIGN
      ? anchor.offset + anchor.size
      : anchor.offset

  // Before 위치 선호 시의 위치 계산
  if (anchor.position === LayoutAnchorPosition.Before) {
    // 1. 앵커 이후에 배치 가능한 경우 (happy case)
    if (viewSize <= viewportSize - layoutAfterAnchorBoundary) {
      return layoutAfterAnchorBoundary
    }

    // 2. 앵커 이전에 배치 가능한 경우 (ok case)
    if (viewSize <= layoutBeforeAnchorBoundary) {
      return layoutBeforeAnchorBoundary - viewSize
    }

    // 3. 공간이 부족한 경우 앵커 위에 겹쳐서 배치 (sad case)
    return Math.max(viewportSize - viewSize, 0)
  } else {
    // After 위치 선호 시의 위치 계산
    // 1. 앵커 이전에 배치 가능한 경우 (happy case)
    if (viewSize <= layoutBeforeAnchorBoundary) {
      return layoutBeforeAnchorBoundary - viewSize
    }

    // 2. 앵커 이후에 배치 가능한 경우 (ok case)
    if (viewSize <= viewportSize - layoutAfterAnchorBoundary) {
      return layoutAfterAnchorBoundary
    }

    // 3. 공간이 부족한 경우 앵커 위에 겹쳐서 배치 (sad case)
    return 0
  }
}
