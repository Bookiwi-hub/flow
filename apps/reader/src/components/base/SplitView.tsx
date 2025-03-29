/**
 * @author ☯채종민
 * @description SplitView 컴포넌트는 화면을 분할하고 사용자가 크기를 조절할 수 있는 인터페이스를 제공합니다.
 * VS Code와 같은 IDE의 분할 패널 기능과 유사하게 동작하며, 수직 또는 수평으로 패널을 분할할 수 있습니다.
 * 각 분할된 패널 사이에는 사용자가 드래그하여 크기를 조절할 수 있는 Sash(구분선)가 위치합니다.
 */
import { Overlay } from '@literal-ui/core'
import { Maybe } from '@literal-ui/hooks'
import clsx from 'clsx'
import {
  Children,
  ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useMobile } from '@flow/reader/hooks'
import { clamp } from '@flow/reader/utils'

/**
 * 분할된 뷰 아이템의 인터페이스
 * @interface ISplitViewItem
 * @property {string} key - 뷰를 식별하는 고유 키값
 * @property {boolean} [visible] - 뷰의 표시 여부 (기본값: true)
 * @property {(size: number) => void} [resize] - 뷰의 크기를 조절하는 함수, delta 값을 받아 현재 크기에 적용
 */
interface ISplitViewItem {
  key: string
  visible?: boolean
  resize?: (size: number) => void
}

/**
 * SplitView의 컨텍스트 인터페이스
 * 자식 컴포넌트들이 부모 SplitView에 자신을 등록할 수 있도록 합니다.
 * @interface SplitViewContext
 * @property {function} registerView - 새로운 뷰를 등록하는 함수
 */
interface SplitViewContext {
  registerView(key: string, view: ISplitViewItem): void
}

/**
 * SplitView 컨텍스트 생성
 * 초기값은 빈 객체, Partial을 사용하여 모든 속성이 옵셔널하도록 설정
 */
const SplitViewContext = createContext<Partial<SplitViewContext>>({})
SplitViewContext.displayName = 'SplitViewContext'

/**
 * SplitView 컨텍스트를 사용하기 위한 커스텀 훅
 * @returns {Partial<SplitViewContext>} SplitView 컨텍스트 값
 */
function useSplitView() {
  return useContext(SplitViewContext)
}

/**
 * 뷰를 SplitView에 등록하기 위한 커스텀 훅
 * useEffect를 사용하여 컴포넌트 마운트 시 등록, 언마운트 시 자동으로 정리됨
 *
 * @param {string} key - 뷰의 고유 식별자
 * @param {ISplitViewItem} view - 등록할 뷰 객체
 */
function useRegisterView(key: string, view: ISplitViewItem) {
  const { registerView } = useSplitView()

  useEffect(() => {
    registerView?.(key, view)
  }, [key, registerView, view])
}

/**
 * 크기 상태와 크기 조절 함수를 제공하는 커스텀 훅
 *
 * @param {number} [preferredSize] - 선호하는 초기 크기
 * @param {number} [minSize=0] - 최소 크기 제한
 * @param {number} [maxSize=Number.POSITIVE_INFINITY] - 최대 크기 제한
 * @returns {[number | undefined, (delta: number) => void]} - [현재 크기, 크기 조절 함수]
 */
function useSize(
  preferredSize?: number,
  minSize = 0,
  maxSize = Number.POSITIVE_INFINITY,
) {
  // 크기 상태 관리
  const [size, setSize] = useState(preferredSize)

  // 크기 조절 함수 - delta 값만큼 현재 크기를 변경하되 min/max 범위 내에서 제한
  const resize = useCallback(
    (delta: number) => {
      setSize((size) => size && clamp(size + delta, minSize, maxSize))
    },
    [maxSize, minSize],
  )

  return [size, resize] as const
}

/**
 * SplitView의 각 아이템을 설정하기 위한 커스텀 훅
 * 각 분할된 뷰가 자신의 크기와 표시 여부를 관리하는 데 사용
 *
 * @param {React.FC | string} key - 뷰의 고유 식별자 (컴포넌트 함수나 문자열)
 * @param {Object} options - 뷰 설정 옵션
 * @param {number} [options.preferredSize] - 선호하는 초기 크기
 * @param {number} [options.minSize=0] - 최소 크기 제한
 * @param {number} [options.maxSize=Number.POSITIVE_INFINITY] - 최대 크기 제한
 * @param {boolean} [options.visible=true] - 뷰의 표시 여부
 * @returns {{ size: number | undefined }} - 현재 뷰의 크기
 */
export function useSplitViewItem(
  key: React.FC | string,
  {
    preferredSize,
    minSize = 0,
    maxSize = Number.POSITIVE_INFINITY,
    visible = true,
  }: {
    preferredSize?: number
    minSize?: number
    maxSize?: number
    visible?: boolean
  } = {},
) {
  // 크기 상태와 조절 함수 생성
  const [size, _resize] = useSize(preferredSize, minSize, maxSize)

  // 최소/최대 크기가 같으면 크기 조절 불가능
  const resize = minSize === maxSize ? undefined : _resize

  // 키가 컴포넌트 함수인 경우 함수 이름을 사용
  const stringKey = typeof key === 'string' ? key : key.name

  // 뷰 객체 생성 (메모이제이션으로 불필요한 리렌더링 방지)
  const view = useMemo(
    () => ({
      key: stringKey,
      resize,
      visible,
    }),
    [stringKey, resize, visible],
  )

  // 뷰를 SplitView에 등록
  useRegisterView(stringKey, view)

  return { size }
}

/**
 * SplitView 컴포넌트의 Props 인터페이스
 * @extends {ComponentProps<'div'>} - div 요소의 모든 속성을 상속
 * @property {boolean} [vertical=false] - 수직 분할 여부 (true: 상하 분할, false: 좌우 분할)
 */
interface SplitViewProps extends ComponentProps<'div'> {
  vertical?: boolean
}

/**
 * SplitView 컴포넌트
 * 여러 자식 컴포넌트를 분할된 영역에 배치하고 크기 조절이 가능한 인터페이스를 제공
 *
 * @param {React.ReactNode} children - 분할할 자식 컴포넌트들
 * @param {string} [className] - 추가적인 CSS 클래스
 * @param {boolean} [vertical=false] - 수직 분할 여부
 */
export const SplitView = ({
  children,
  className,
  vertical = false,
}: SplitViewProps) => {
  // 등록된 뷰 맵 관리
  const [viewMap, setViewMap] = useState(new Map<string, ISplitViewItem>())
  const views = [...viewMap.values()]

  // 새 뷰 등록 함수
  const registerView = useCallback((key: string, view: ISplitViewItem) => {
    setViewMap((map) => {
      map.set(key, view)
      return new Map(map) // 새 맵 객체 생성하여 리렌더링 트리거
    })
  }, [])

  // 자식 컴포넌트 배열로 변환
  const childList = Children.toArray(children)
  if (!childList.length) return null

  return (
    <div className={clsx('SplitView relative h-full', className)}>
      <SplitViewContext.Provider value={{ registerView }}>
        <div
          className={clsx(
            'SplitViewContainer flex h-full',
            vertical && 'flex-col', // 수직 분할인 경우 flex-col 클래스 추가
          )}
        >
          {/* 
            자식 컴포넌트들 사이에 Sash(구분선)를 삽입하여 렌더링
            reduce를 사용하여 누적된 결과를 생성 
            (첫 번째 자식은 Sash 없이, 두 번째부터는 Sash와 함께 추가)
          */}
          {childList.reduce((a, c, i) => (
            <>
              {a}
              <Sash vertical={vertical} views={[views[i - 1], views[i]]} />
              {c}
            </>
          ))}
        </div>
      </SplitViewContext.Provider>
    </div>
  )
}

/**
 * 구분선(Sash)의 크기 (픽셀)
 */
const SASH_SIZE = 4

/**
 * Sash 컴포넌트의 Props 인터페이스
 * @interface SashProps
 * @property {boolean} vertical - 수직 구분선 여부
 * @property {Maybe<ISplitViewItem>[]} views - 구분선이 연결하는 양쪽 뷰
 */
interface SashProps {
  vertical: boolean
  views: Maybe<ISplitViewItem>[]
}

/**
 * Sash(구분선) 컴포넌트
 * 두 뷰 사이에 위치하며 사용자가 드래그하여 뷰의 크기를 조절할 수 있게 함
 *
 * @param {boolean} vertical - 수직 구분선 여부 (true: 수평 드래그, false: 수직 드래그)
 * @param {Maybe<ISplitViewItem>[]} views - 연결된 양쪽 뷰 (일반적으로 2개)
 */
const Sash: React.FC<SashProps> = ({ vertical, views }) => {
  // 호버 및 활성 상태 관리
  const [hover, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const mobile = useMobile()

  // 모든 뷰가 visible하고 resize 함수가 있을 때만 활성화
  const enabled = views.every((v) => v?.visible && v?.resize)

  return (
    <div
      className={clsx(
        'sash relative z-30 shrink-0',
        (mobile || !enabled) && 'pointer-events-none', // 모바일이거나 비활성화 시 이벤트 무시
        vertical ? 'cursor-ns-resize' : 'cursor-ew-resize', // 수직/수평에 따른 커서 스타일
      )}
      style={{
        // 수직/수평에 따른 크기 설정
        [vertical ? 'height' : 'width']: SASH_SIZE,
        [vertical ? 'marginBlock' : 'marginInline']: -SASH_SIZE / 2, // 마진을 음수로 설정하여 겹치는 효과
      }}
      onMouseEnter={() => {
        setHover(true)
      }}
      onMouseLeave={() => {
        setHover(false)
      }}
      onMouseDown={() => {
        setActive(true)

        /**
         * 마우스 드래그 중 이벤트 핸들러
         * 마우스 이동에 따라 연결된 뷰들의 크기를 조절
         *
         * @param {MouseEvent} e - 마우스 이벤트 객체
         */
        function handleMouseMove(e: MouseEvent) {
          // 수직/수평에 따른 마우스 이동 거리 계산
          const delta = vertical ? e.movementY : e.movementX

          // 연결된 모든 뷰에 크기 변경 적용
          // 첫 번째 뷰는 양수로, 두 번째 뷰는 음수로 적용 (서로 반대 방향)
          views.forEach((v, i) => {
            v?.resize?.(delta * (-1) ** i)
          })
        }

        // 전역 이벤트 리스너 등록
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', function handleMouseUp() {
          // mousedown 상태에서는 mouseleave가 발생하지 않으므로 여기서 처리
          setHover(false)
          setActive(false)

          // 이벤트 리스너 정리
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseup', handleMouseUp)
        })
      }}
    >
      {/* 구분선 시각적 표시 */}
      <div
        className={clsx(
          'pointer-events-none absolute inset-0 border-black/10 transition-[background-color]',
          // 수직/수평에 따른 위치 및 스타일 조정
          vertical
            ? 'top-1/2 -translate-y-1/2 border-b' // 수직 구분선 (가로 줄)
            : 'left-1/2 -translate-x-1/2 border-r', // 수평 구분선 (세로 줄)
          // 호버나 활성 상태일 때 강조 스타일
          (hover || active) && 'bg-primary70 h-full w-full border-none',
        )}
      ></div>
      {/* 드래그 중일 때 전체 화면에 투명 오버레이 추가 (다른 요소의 이벤트 차단) */}
      {active && <Overlay className="!bg-transparent" />}
    </div>
  )
}
