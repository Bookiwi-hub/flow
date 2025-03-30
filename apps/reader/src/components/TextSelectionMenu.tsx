/**
 * @author 한상우
 * @description  전자책 리더에서 텍스트 선택 시 나타나는 컨텍스트 메뉴를 구현합니다.
 * @date 2025-03-27
 * @link {TextSelectionMenu.md}
 */

import { Overlay } from '@literal-ui/core'
import clsx from 'clsx'
import { useCallback, useRef, useState } from 'react'
import FocusLock from 'react-focus-lock'
import {
  MdCopyAll,
  MdOutlineAddBox,
  MdOutlineEdit,
  MdOutlineIndeterminateCheckBox,
  MdSearch,
} from 'react-icons/md'
import { useSnapshot } from 'valtio'

import { typeMap, colorMap } from '../annotation'
import {
  isForwardSelection,
  useMobile,
  useSetAction,
  useTextSelection,
  useTranslation,
  useTypography,
} from '../hooks'
import { BookTab } from '../models'
import { isTouchScreen, scale } from '../platform'
import { copy, keys, last } from '../utils'

import { Button, IconButton } from './Button'
import { TextField } from './Form'
import { layout, LayoutAnchorMode, LayoutAnchorPosition } from './base'

/**
 * TextSelectionMenu 컴포넌트의 주요 진입점
 *
 * 이 컴포넌트는 텍스트 선택 시 나타나는 메뉴의 최상위 컴포넌트입니다.
 * tab 속성으로 현재 활성화된 BookTab 인스턴스를 받아 텍스트 선택 정보를 추적합니다.
 *
 * @param {Object} props - 컴포넌트 props
 * @param {BookTab} props.tab - 현재 활성화된 책 탭 인스턴스
 */
interface TextSelectionMenuProps {
  tab: BookTab
}
export const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({
  tab,
}) => {
  // valtio의 useSnapshot을 사용하여 tab 객체의 상태 변화를 구독
  const { rendition, annotationRange } = useSnapshot(tab)

  /**
   * rendition manager의 view를 가져오는 함수
   *
   * rendition은 반응형이지만 manager는 아니므로 useCallback으로
   * 최신 rendition을 참조하는 함수를 생성합니다.
   * 간단히 설명해보면면
   * 1.view 함수는 useCallback으로 메모이제이션
   * 2. 의존성 배열 [rendition]를 넣어서 rendition이 변경될 때마다 새로운 view 함수를 생성
   *
   * 그래서 이 패턴이 동작하는 방식은
   * rendition 객체가 업데이트되면 (valtio의 useSnapshot에 의해 감지됨)
   * useCallback은 새 view 함수를 생성합니다
   * 이 새 함수는 클로저를 통해 최신 rendition 값을 참조
   * 따라서 view()를 호출하면 항상 최신 rendition 객체의 manager와 views를 참조
   */

  const view = useCallback(() => {
    ;``
    return rendition?.manager?.views._views[0]
  }, [rendition])

  // 현재 view의 window 객체를 가져옴
  const win = view()?.window
  // 커스텀 훅을 사용해 텍스트 선택 정보를 가져옴
  const [selection, setSelection] = useTextSelection(win)

  // view 요소(DOM)를 가져옴
  /**
     * view() 함수는 EPUB 렌더러(rendition)의 현재 보이는 뷰에 접근합니다.
     * view()?.element는 그 뷰의 실제 DOM 요소(HTMLElement)를 가져옵니다.
     * 텍스트가 선택된 위치를 기준으로 메뉴를 표시해야 하는데, 이 위치는 뷰를 기준으로 계산됩니다.
     *
     * 이 요소가 없으면(if (!el) return null) 메뉴를 표시할 수 없으므로 함수를 종료합니다.}

    */
  const el = view()?.element as HTMLElement
  if (!el) return null

  /**
   * 선택 영역(Range) 결정 로직
   *
   * 두 가지 소스에서 선택 영역을 가져올 수 있음:
   * 1. 현재 사용자가 선택한 텍스트 (selection)
   * 2. 이미 주석이 달린 영역 (annotationRange)
   *
   * 두 정보가 모두 있을 경우 selection이 우선 (주석 위에서 새 선택을 할 경우)
   */
  const range = selection?.getRangeAt(0) ?? annotationRange
  if (!range) return null

  /**
   * 메뉴 위치 결정 로직
   *
   * 일반적으로 선택 방향에 따라 메뉴 위치를 다르게 표시함:
   * - 정방향 선택: 선택 끝 부분에 메뉴 표시
   * - 역방향 선택: 선택 시작 부분에 메뉴 표시
   *
   * 하지만 터치스크린 환경에서는 항상 선택 위에 표시 (모바일 브라우저 선택 UI와 겹치지 않도록)
   */
  const forward = isTouchScreen
    ? false
    : selection
    ? isForwardSelection(selection)
    : true

  // 선택 영역의 사각형 좌표 정보를 가져옴
  const rects = [...range.getClientRects()].filter((r) => Math.round(r.width))
  const anchorRect = rects && (forward ? last(rects) : rects[0])
  if (!anchorRect) return null

  // 선택된 텍스트 내용 추출
  const contents = range.cloneContents()
  const text = contents.textContent?.trim()
  if (!text) return null

  /**
   * 실제 메뉴 렌더링
   *
   * 필요한 모든 정보를 TextSelectionMenuRenderer에 전달하여 메뉴를 렌더링합니다.
   * 이렇게 컴포넌트를 분리하면 상태 초기화 및 재계산이 필요할 때 깔끔하게 처리할 수 있습니다.
   */
  return (
    <TextSelectionMenuRenderer
      tab={tab}
      range={range as Range}
      anchorRect={anchorRect}
      containerRect={el.parentElement!.getBoundingClientRect()}
      // 좌표 시스템 변환: 이 요소의 경계 정보를 가져옵니다
      // el.parentElement를 통해 컨테이너 요소에 접근하여 더 넓은 컨텍스트에서 위치를 계산합니다.
      /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/getClientRects) */
      viewRect={el.getBoundingClientRect()}
      text={text}
      forward={forward}
      hide={() => {
        // 선택 영역 해제 함수
        if (selection) {
          selection.removeAllRanges()
          setSelection(undefined)
        }
        // 주석 선택 영역 해제
        if (tab.annotationRange) {
          tab.annotationRange = undefined
        }
      }}
    />
  )
}

// 아이콘 및 주석 버튼 크기 - 화면 크기에 따라 조정됨
const ICON_SIZE = scale(22, 28)
const ANNOTATION_SIZE = scale(24, 30)

/**
 * TextSelectionMenuRenderer 컴포넌트
 *
 * 실제 선택 메뉴 UI를 렌더링하는 컴포넌트입니다.
 * 메뉴 위치 계산 및 UI 상태 관리를 담당합니다.
 */
interface TextSelectionMenuRendererProps {
  tab: BookTab
  range: Range
  anchorRect: DOMRect
  containerRect: DOMRect
  viewRect: DOMRect
  text: string
  forward: boolean
  hide: () => void
}
const TextSelectionMenuRenderer: React.FC<TextSelectionMenuRendererProps> = ({
  tab,
  range,
  anchorRect,
  containerRect,
  viewRect,
  forward,
  text,
  hide,
}) => {
  const setAction = useSetAction()
  // 주석 입력 필드에 대한 ref
  const ref = useRef<HTMLInputElement>(null)
  // 메뉴 자체의 크기를 저장하는 상태 (위치 계산에 사용)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const mobile = useMobile()
  const t = useTranslation('menu')

  // 현재 선택 영역을 EPUB CFI 형식으로 변환 (전자책 위치 참조 표준)
  const cfi = tab.rangeToCfi(range)
  // 현재 선택 영역에 이미 주석이 있는지 확인
  const annotation = tab.book.annotations.find((a) => a.cfi === cfi)
  // 주석 모드 상태 (주석 추가/편집 UI 표시 여부)
  const [annotate, setAnnotate] = useState(!!annotation)

  // 메뉴 위치를 계산하기 위한 앵커 위치 (선택 방향에 따라 다름)
  const position = forward
    ? LayoutAnchorPosition.Before
    : LayoutAnchorPosition.After

  // 줄 높이 계산 (메뉴 위치 조정에 사용)
  const { zoom } = useTypography(tab)
  const endContainer = forward ? range.endContainer : range.startContainer
  const _lineHeight = parseFloat(
    getComputedStyle(endContainer.parentElement!).lineHeight,
  )
  // 줄 높이가 숫자가 아닌 경우 (예: 'normal') 선택 영역 높이 사용
  const lineHeight = isNaN(_lineHeight)
    ? anchorRect.height
    : _lineHeight * (zoom ?? 1)

  return (
    <FocusLock disabled={mobile}>
      {/* 배경 오버레이 - 메뉴 외부 클릭 시 닫기 위함 */}
      <Overlay className="!z-50 !bg-transparent" onMouseDown={hide} />
      {/** 메뉴 컨테이너
       * 동적 측정: 메뉴가 렌더링된 후 실제 크기를 측정하여 위치계산에 사용합니다.
       * 이렇게 하면 콘텐츠에 따라 크기가 달라지는 동적 메뉴를 정확하게 배치할 수 있습니다.
       * 조건부 포커스: 모바일이 아닌 경우에만 메뉴에 포커스를 설정하여 키보드 접근성을 제공합니다.
       * 모바일에서는 화면 키보드가 표시될 수 있으므로 이를 방지합니다. */}
      <div
        ref={(el) => {
          if (!el) return
          // 메뉴 크기 측정 (위치 계산에 사용)
          setWidth(el.clientWidth)
          setHeight(el.clientHeight)
          // 모바일이 아닌 경우 자동 포커스
          if (!mobile) {
            el.focus()
          }
        }}
        className={clsx(
          'bg-surface text-on-surface-variant shadow-1 absolute z-50 p-2 focus:outline-none',
        )}
        style={{
          // 메뉴 위치 계산 - 가로 위치 (부모 컨테이너 기반으로 상대 좌표를 사용 **중요)
          left: layout(containerRect.width, width, {
            offset: anchorRect.left + viewRect.left - containerRect.left,
            size: anchorRect.width,
            mode: LayoutAnchorMode.ALIGN,
            position,
          }),
          // 메뉴 위치 계산 - 세로 위치
          top: layout(containerRect.height, height, {
            offset: anchorRect.top - (lineHeight - anchorRect.height) / 2,
            size: lineHeight,
            position,
          }),
        }}
        tabIndex={-1}
        // 키보드 단축키 처리 (Ctrl+C)
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'c' && e.ctrlKey) {
            copy(text)
          }
        }}
      >
        {/* 주석 모드일 때는 텍스트 입력 필드 표시 */}
        {annotate ? (
          <div className="mb-3">
            <TextField
              mRef={ref}
              as="textarea"
              name="notes"
              defaultValue={annotation?.notes}
              hideLabel
              className="h-40 w-72"
              autoFocus
            />
          </div>
        ) : (
          // 일반 모드일 때는 액션 버튼들 표시
          <div className="text-on-surface-variant -mx- mb-3 flex gap-1">
            {/* 복사 버튼 */}
            <IconButton
              title={t('copy')}
              Icon={MdCopyAll}
              size={ICON_SIZE}
              onClick={() => {
                hide()
                copy(text)
              }}
            />
            {/* 책 내 검색 버튼 */}
            <IconButton
              title={t('search_in_book')}
              Icon={MdSearch}
              size={ICON_SIZE}
              onClick={() => {
                hide()
                setAction('search')
                tab.setKeyword(text)
              }}
            />
            {/* 주석 추가 버튼 */}
            <IconButton
              title={t('annotate')}
              Icon={MdOutlineEdit}
              size={ICON_SIZE}
              onClick={() => {
                setAnnotate(true)
              }}
            />
            {/* 정의 추가/제거 버튼 (이미 정의된 경우 제거 버튼으로 변경) */}
            {tab.isDefined(text) ? (
              <IconButton
                title={t('undefine')}
                Icon={MdOutlineIndeterminateCheckBox}
                size={ICON_SIZE}
                onClick={() => {
                  hide()
                  tab.undefine(text)
                }}
              />
            ) : (
              <IconButton
                title={t('define')}
                Icon={MdOutlineAddBox}
                size={ICON_SIZE}
                onClick={() => {
                  hide()
                  tab.define([text])
                }}
              />
            )}
          </div>
        )}

        {/* 주석 스타일 선택 영역 (타입과 색상 조합) */}
        <div className="space-y-2">
          {/* 주석 타입 반복 (highlight, underline 등) */}
          {keys(typeMap).map((type) => (
            <div key={type} className="flex gap-2">
              {/* 각 타입별 색상 옵션 반복 */}
              {keys(colorMap).map((color) => (
                <div
                  key={color}
                  style={{
                    [typeMap[type].style]: colorMap[color],
                    width: ANNOTATION_SIZE,
                    height: ANNOTATION_SIZE,
                    fontSize: scale(16, 20),
                  }}
                  className={clsx(
                    'typescale-body-large text-on-surface-variant flex cursor-pointer items-center justify-center',
                    typeMap[type].class,
                  )}
                  onClick={() => {
                    // 주석 타입과 색상 선택 시 주석 추가
                    tab.putAnnotation(
                      type,
                      cfi,
                      color,
                      text,
                      ref.current?.value,
                    )
                    hide()
                  }}
                >
                  A
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 주석 모드일 때 하단 버튼 영역 */}
        {annotate && (
          <div className="mt-3 flex">
            {/* 기존 주석이 있는 경우 삭제 버튼 표시 */}
            {annotation && (
              <Button
                compact
                variant="secondary"
                onClick={() => {
                  tab.removeAnnotation(cfi)
                  hide()
                }}
              >
                {t('delete')}
              </Button>
            )}
            {/* 주석 저장 버튼 */}
            <Button
              className="ml-auto"
              compact
              onClick={() => {
                tab.putAnnotation(
                  annotation?.type ?? 'highlight',
                  cfi,
                  annotation?.color ?? 'yellow',
                  text,
                  ref.current?.value,
                )
                hide()
              }}
            >
              {t(annotation ? 'update' : 'create')}
            </Button>
          </div>
        )}
      </div>
    </FocusLock>
  )
}
