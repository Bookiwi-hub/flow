/**
 * @author 조현지
 * @description 사용자의 텍스트 선택을 추적하고 관리하는 React 훅
 * @date 2025-03-25
 */

// https://github.com/juliankrispel/use-text-selection

import { useEventListener } from '@literal-ui/hooks'
import { useState } from 'react'

import { isTouchScreen } from '../platform'

import { useForceRender } from './useForceRender'

/**
 * 유효한 선택 영역이 있는지 확인하는 함수다.
 * Selection 객체가 존재하고 접힌 상태가 아닌지 검사한다.
 *
 * 여기서 'selection'은 브라우저의 Selection API에서 제공하는 객체로,
 * 사용자가 드래그하여 선택한 텍스트 영역에 대한 정보를 담고 있다.
 *
 * 'isCollapsed' 속성이 true일 경우, 선택 영역의 시작점과 끝점이 동일하다는
 * 의미로 실제로 선택된 텍스트가 없음을 나타낸다. 예를 들어, 텍스트를
 * 클릭만 했을 때 커서는 있지만 선택된 텍스트는 없는 상태와 같다.
 *
 * 이 함수는 타입 가드(type guard) 역할도 하여 반환값이 true일 경우
 * TypeScript가 selection 변수를 Selection 타입으로 좁혀준다.
 *
 * @param selection - 검사할 Selection 객체, undefined나 null일 수 있다
 * @returns selection이 유효하고 텍스트가 선택되어 있으면 true, 그렇지 않으면 false를 반환한다
 */
export function hasSelection(
  selection?: Selection | null,
): selection is Selection {
  return !(!selection || selection.isCollapsed)
}

/**
 * 선택 방향이 앞으로 진행되는지 확인하는 함수다.
 * 앵커 노드와 포커스 노드 간의 범위를 설정하여 방향을 확인한다.
 *
 * 브라우저에서 텍스트 선택 시 두 가지 중요한 지점이 있다:
 * - anchorNode: 사용자가 선택을 시작한 노드(마우스 버튼을 누른 위치)
 * - focusNode: 사용자가 선택을 끝낸 노드(마우스 버튼을 뗀 위치)
 *
 * 일반적으로 왼쪽에서 오른쪽으로 텍스트를 선택할 때는 앵커가 포커스보다
 * 앞에 위치하여 '정방향(forward)' 선택이 된다. 반대로 오른쪽에서 왼쪽으로
 * 선택하면 '역방향(backward)' 선택이 된다.
 *
 * 이 함수는 DOM의 Range API를 사용하여 앵커에서 포커스로 범위를 만들고,
 * 그 범위가 collapsed(접힌 상태)가 아니면 정방향 선택으로 판단한다.
 * range.collapsed가 false이면 앵커가 포커스보다 앞에 있다는 의미다.
 *
 * 앵커나 포커스 노드가 없는 경우 기본적으로 true를 반환하여 정방향으로 간주한다.
 *
 * @param selection - 방향을 확인할 Selection 객체
 * @returns 선택이 정방향(앵커→포커스)이면 true, 역방향이면 false를 반환한다
 */
// https://htmldom.dev/get-the-direction-of-the-text-selection/
export function isForwardSelection(selection: Selection) {
  if (selection.anchorNode && selection.focusNode) {
    const range = document.createRange()
    range.setStart(selection.anchorNode, selection.anchorOffset)
    range.setEnd(selection.focusNode, selection.focusOffset)

    return !range.collapsed
  }

  return true
}

/**
 * 텍스트 선택을 추적하는 React 훅이다.
 * 터치 스크린과 일반 화면에서 다른 이벤트를 사용하여 선택을 감지한다.
 */
export function useTextSelection(win?: Window) {
  // 선택된 텍스트 정보를 저장하는 상태 변수다.
  const [selection, setSelection] = useState<Selection | undefined>()
  // 컴포넌트를 강제로 다시 렌더링하는 함수다.
  const render = useForceRender()

  // 터치 스크린 장치에서는 마우스/터치/포인터 이벤트가 선택이 생성될 때 작동하지 않는다.
  useEventListener(
    isTouchScreen ? win?.document : win,
    isTouchScreen ? 'selectionchange' : 'mouseup',
    () => {
      // 현재 창에서 선택된 텍스트를 가져온다.
      const s = win?.getSelection()

      // 유효한 선택이 있는 경우 상태를 업데이트한다.
      if (hasSelection(s)) {
        // 때때로 `getSelection`은 빈 공간을 클릭하여 텍스트를 선택할 때
        // 동일한 `selection`을 반환한다.
        render()
        setSelection(s)
      }
    },
  )

  // 안드로이드에서 길게 탭할 때 컨텍스트 메뉴를 비활성화한다.
  useEventListener(win, 'contextmenu', (e) => {
    if (isTouchScreen) {
      e.preventDefault()
    }
  })

  // 선택된 텍스트와 선택을 설정하는 함수를 반환한다.
  return [selection, setSelection] as const
}

/**
 * 사용자가 텍스트를 선택할 때 그 선택 정보를 추적하고 관리하는 React 커스텀 훅이다.
 * 터치 스크린과 일반 화면 환경에서 모두 작동하도록 설계되어 있으며, 선택의 방향과 유효성을 확인하는 유틸리티 함수들도 포함하고 있다.
 */
