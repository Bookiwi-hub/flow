/**
 * @author ☯채종민
 * @description DropZone 컴포넌트는 드래그 앤 드롭 기능을 제공하는 영역 생성하는 컴포넌트.
 *
 */

import clsx from 'clsx'
import {
  useContext,
  useState,
  createContext,
  DragEvent,
  useCallback,
  useEffect,
} from 'react'

/**
 * DropZone 컴포넌트의 props 인터페이스
 * @interface DropZoneProps
 * @property {string} [className] - 추가적인 CSS 클래스
 * @property {(e: DragEvent<HTMLDivElement>, position?: Position) => void} [onDrop] - 드롭 이벤트 핸들러
 * @property {boolean} [split] - 드롭 영역을 분할할지 여부
 */
interface DropZoneProps {
  className?: string
  onDrop?: (e: DragEvent<HTMLDivElement>, position?: Position) => void
  split?: boolean
}

/**
 * DropZone 컴포넌트의 메인 래퍼
 * DndProvider로 감싸서 드래그 앤 드롭 컨텍스트를 제공합니다.
 */
export const DropZone: React.FC<DropZoneProps> = (props) => {
  return (
    <DndProvider>
      <DropZoneInner {...props} />
    </DndProvider>
  )
}

/**
 * 드롭 가능한 위치를 정의하는 타입
 * - universe: 전체 영역
 * - left: 왼쪽 영역
 * - right: 오른쪽 영역
 * - top: 상단 영역
 * - bottom: 하단 영역
 */
type Position = 'universe' | 'left' | 'right' | 'top' | 'bottom'

/**
 * 드래그된 데이터가 허용되는지 확인하는 함수
 * text/plain과 Files 타입만 허용합니다.
 *
 * @param {DragEvent} [e] - 드래그 이벤트
 * @returns {boolean} 데이터가 허용되는지 여부
 */
function accept(e?: DragEvent) {
  const dt = e?.dataTransfer
  return !!dt?.types.every((t) => ['text/plain', 'Files'].includes(t))
}

/**
 * DropZone의 내부 구현 컴포넌트
 * 실제 드래그 앤 드롭 로직을 처리합니다.
 *
 * @param {React.ReactNode} children - 드롭존 내부에 표시될 자식 컴포넌트
 * @param {string} [className] - 추가적인 CSS 클래스
 * @param {(e: DragEvent<HTMLDivElement>, position?: Position) => void} [onDrop] - 드롭 이벤트 발생 시 호출될 콜백 함수
 * @param {boolean} [split=false] - 드롭 영역을 분할할지 여부. true일 경우 드롭 위치에 따라 다른 동작 수행
 */
const DropZoneInner: React.FC<DropZoneProps> = ({
  children,
  className,
  onDrop,
  split = false,
}) => {
  // 드래그 앤 드롭 컨텍스트에서 현재 드래그 상태와 이벤트 설정 함수를 가져옴
  const { dragover, setDragEvent } = useDndContext()
  // 현재 드롭 가능한 위치 상태를 관리
  const [position, setPosition] = useState<Position>()

  // 드래그가 끝나면 position을 초기화하는 useEffect
  // dragover가 false가 되면 position을 undefined로 설정
  useEffect(() => {
    if (!dragover) setDragEvent(undefined)
  }, [dragover])

  /**
   * 드래그 오버 이벤트 핸들러
   * split이 true일 경우 드롭 영역을 분할하여 position을 계산합니다.
   */
  const handleDragover = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      // 이벤트 전파 중단 및 기본 동작 방지
      e.stopPropagation()
      e.preventDefault()

      setPosition(() => {
        // split이 false면 전체 영역으로 설정
        if (!split) return 'universe'

        // 드래그된 요소의 위치와 크기 정보를 가져옴
        const rect = (e.target as HTMLDivElement).getBoundingClientRect()
        if (!rect.width || !rect.height) return

        // 드래그된 위치의 상대적 좌표 계산 (0~1 사이의 값)
        const offsetLeft = (e.clientX - rect.left) / rect.width
        const offsetTop = (e.clientY - rect.top) / rect.height
        const offsetRight = 1 - offsetLeft
        const offsetBottom = 1 - offsetTop
        // 드롭 영역 분할을 위한 임계값 (15%)
        const threshold = 0.15

        // TODO: 상하 분할 기능 추가 필요
        // 현재는 좌우 분할만 구현되어 있음
        const minOffset = Math.min(offsetLeft, offsetRight)

        // 임계값보다 크면 전체 영역으로 설정
        if (minOffset > threshold) return 'universe'
        // 가장 가까운 가장자리에 따라 위치 설정
        if (minOffset === offsetLeft) return 'left'
        if (minOffset === offsetRight) return 'right'
        if (minOffset === offsetTop) return 'top'
        if (minOffset === offsetBottom) return 'bottom'
      })
    },
    [split],
  )

  return (
    <div
      className={clsx('relative', className)}
      // 드래그 진입 이벤트 핸들러
      // 드래그가 시작될 때 호출되며, 드래그 상태를 설정
      onDragEnter={(e) => {
        console.log('drag enter', e.dataTransfer.types)
        if (dragover) return

        setDragEvent(e)
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      {/* 자식 컴포넌트 렌더링 */}
      {children}

      {/* 드래그 오버 시 표시되는 하이라이트 영역 */}
      {/* position에 따라 다른 스타일 적용 */}
      {dragover && (
        <div
          className={clsx(
            'bg-outline/20 absolute z-10 transition',
            position === 'left' && 'inset-y-0 right-1/2 left-0',
            position === 'right' && 'inset-y-0 right-0 left-1/2',
            position === 'top' && 'inset-x-0 top-0 bottom-1/2',
            position === 'bottom' && 'inset-x-0 top-1/2 bottom-0',
            position === 'universe' && 'inset-0',
          )}
        ></div>
      )}
      {/* 드래그 이벤트 처리 영역 */}
      {/* 드래그 오버, 드래그 리브, 드롭 이벤트 처리 */}
      {dragover && (
        <div
          className="absolute inset-0 z-10"
          onDragOver={handleDragover}
          onDragLeave={(e) => {
            console.log('drag leave', e.target)
            setDragEvent() //false가 됨
          }}
          onDrop={(e) => {
            console.log('drop', e)
            setDragEvent() //false가 됨
            e.stopPropagation()
            e.preventDefault()
            onDrop?.(e, position)
          }}
        ></div>
      )}
    </div>
  )
}

/**
 * 드래그 앤 드롭 컨텍스트
 * 드래그 상태와 이벤트 설정 함수를 제공합니다.
 */
const DndContext = createContext<{
  dragover: boolean
  setDragEvent: (e?: DragEvent) => void
}>({ dragover: false, setDragEvent: () => {} })

/**
 * 드래그 앤 드롭 컨텍스트 프로바이더
 * 드래그 상태를 관리하고 하위 컴포넌트에 전달합니다.
 */
const DndProvider: React.FC = ({ children }) => {
  const [dragover, setDragover] = useState(false)

  const setDragEvent = useCallback((e?: DragEvent) => {
    setDragover(accept(e))
  }, [])

  return (
    <DndContext.Provider value={{ dragover, setDragEvent }}>
      {children}
    </DndContext.Provider>
  )
}

/**
 * 드래그 앤 드롭 컨텍스트를 사용하기 위한 커스텀 훅
 * @returns {Object} 드래그 상태와 이벤트 설정 함수
 */
export function useDndContext() {
  return useContext(DndContext)
}
