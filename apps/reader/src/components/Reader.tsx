import { useEventListener } from '@literal-ui/hooks'
import clsx from 'clsx'
import React, {
  ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { MdChevronRight, MdWebAsset } from 'react-icons/md'
import { RiBookLine } from 'react-icons/ri'
import { PhotoSlider } from 'react-photo-view'
import { useSetRecoilState } from 'recoil'
import useTilg from 'tilg'
import { useSnapshot } from 'valtio'

import { RenditionSpread } from '@flow/epubjs/types/rendition'
import { navbarState } from '@flow/reader/state'

import { db } from '../db'
import { handleFiles } from '../file'
import {
  hasSelection,
  useBackground,
  useColorScheme,
  useDisablePinchZooming,
  useMobile,
  useSync,
  useTranslation,
  useTypography,
} from '../hooks'
import { BookTab, reader, useReaderSnapshot } from '../models'
import { isTouchScreen } from '../platform'
import { updateCustomStyle } from '../styles'

import {
  getClickedAnnotation,
  setClickedAnnotation,
  Annotations,
} from './Annotation'
import { Tab } from './Tab'
import { TextSelectionMenu } from './TextSelectionMenu'
import { DropZone, SplitView, useDndContext, useSplitViewItem } from './base'
import * as pages from './pages'

/**
 * reader 컴포넌트 분석
 * 작성자: 조현지
 * @see {@link ./deep-dive/reader-component/Reader.md}
 */

/**
 * 키보드 이벤트 핸들러 함수
 * @param {BookTab} tab - 현재 활성화된 책 탭
 * @returns {(e: KeyboardEvent) => void} - 키보드 이벤트 핸들러 함수
 * @description 키보드 화살표 키 및 스페이스바로 페이지를 이동하는 함수를 반환한다.
 * 좌측/상단 화살표 키는 이전 페이지, 우측/하단 화살표 키는 다음 페이지로 이동한다.
 * 스페이스바는 기본적으로 다음 페이지, Shift+스페이스바는 이전 페이지로 이동한다.
 */
function handleKeyDown(tab?: BookTab) {
  return (e: KeyboardEvent) => {
    try {
      switch (e.code) {
        case 'ArrowLeft':
        case 'ArrowUp':
          tab?.prev()
          break
        case 'ArrowRight':
        case 'ArrowDown':
          tab?.next()
          break
        case 'Space':
          e.shiftKey ? tab?.prev() : tab?.next()
      }
    } catch (error) {
      // ignore `rendition is undefined` error
    }
  }
}

/**
 * 리더 그리드 뷰 컴포넌트
 * @returns {JSX.Element | null} - 리더 그리드 뷰 컴포넌트 또는 null
 * @description 여러 책 그룹을 그리드 형태로 표시하는 컴포넌트이다.
 * 그룹이 없으면 null을 반환하고, 그룹이 있으면 각 그룹을 ReaderGroup 컴포넌트로 렌더링한다.
 * 키보드 이벤트 리스너를 등록하여 포커스된 책 탭의 페이지 이동을 처리한다.
 */
export function ReaderGridView() {
  const { groups } = useReaderSnapshot()

  useEventListener('keydown', handleKeyDown(reader.focusedBookTab))

  if (!groups.length) return null
  return (
    <SplitView className={clsx('ReaderGridView')}>
      {groups.map(({ id }, i) => (
        <ReaderGroup key={id} index={i} />
      ))}
    </SplitView>
  )
}

interface ReaderGroupProps {
  index: number
}
function ReaderGroup({ index }: ReaderGroupProps) {
  // 현재 인덱스에 해당하는 그룹 객체를 가져온다. 느낌표는 null이 아님을 보장한다.
  const group = reader.groups[index]!

  // 현재 포커스된 그룹의 인덱스를 가져온다.
  const { focusedIndex } = useReaderSnapshot()

  // 현재 그룹의 탭들과 선택된 탭의 인덱스를 가져온다.
  const { tabs, selectedIndex } = useSnapshot(group)

  // 번역 함수를 가져온다.
  const t = useTranslation()

  // 분할 뷰 아이템의 크기를 가져온다. 비활성화된 sash 크기 조정 옵션을 설정한다.
  const { size } = useSplitViewItem(`${ReaderGroup.name}.${index}`, {
    // to disable sash resize
    visible: false,
  })

  // 마우스 다운 이벤트 발생 시 현재 그룹을 선택하는 핸들러 함수를 정의한다.
  const handleMouseDown = useCallback(() => {
    reader.selectGroup(index)
  }, [index])

  return (
    <div
      className="ReaderGroup flex flex-1 flex-col overflow-hidden focus:outline-none"
      onMouseDown={handleMouseDown}
      style={{ width: size }}
    >
      <Tab.List
        className="hidden sm:flex"
        onDelete={() => reader.removeGroup(index)}
      >
        {tabs.map((tab, i) => {
          const selected = i === selectedIndex
          const focused = index === focusedIndex && selected
          return (
            <Tab
              key={tab.id}
              selected={selected}
              focused={focused}
              onClick={() => group.selectTab(i)}
              onDelete={() => reader.removeTab(i, index)}
              Icon={tab instanceof BookTab ? RiBookLine : MdWebAsset}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', `${index},${i}`)
              }}
            >
              {tab.isBook ? tab.title : t(`${tab.title}.title`)}
            </Tab>
          )
        })}
      </Tab.List>

      <DropZone
        className={clsx('flex-1', isTouchScreen || 'h-0')}
        split
        onDrop={async (e, position) => {
          // read `e.dataTransfer` first to avoid get empty value after `await`
          // await 이후에 e.dataTransfer가 비어있는 것을 방지하기 위해 먼저 읽는다.
          const files = e.dataTransfer.files
          let tabs = []

          // 파일이 드롭된 경우
          if (files.length) {
            // 파일을 처리하여 탭 배열을 생성한다.
            tabs = await handleFiles(files)
          } else {
            // 텍스트 데이터가 드롭된 경우
            const text = e.dataTransfer.getData('text/plain')
            // 텍스트에 쉼표가 포함된 경우 탭에서 드래그된 것으로 간주한다.
            const fromTab = text.includes(',')

            if (fromTab) {
              // 텍스트를 쉼표로 분리하여 그룹 인덱스와 탭 인덱스를 얻는다.
              const indexes = text.split(',')
              const groupIdx = Number(indexes[0])

              // 현재 그룹과 동일한 그룹에서 드래그된 경우 특정 조건을 확인한다.
              if (index === groupIdx) {
                // 그룹에 탭이 하나만 있으면 이동할 수 없다.
                if (group.tabs.length === 1) return
                // 드롭 위치가 'universe'인 경우 이동할 수 없다.
                if (position === 'universe') return
              }

              // 탭 인덱스를 얻는다.
              const tabIdx = Number(indexes[1])
              // 해당 탭을 제거하고 가져온다.
              const tab = reader.removeTab(tabIdx, groupIdx)
              // 탭이 존재하면 탭 배열에 추가한다.
              if (tab) tabs.push(tab)
            } else {
              const id = text
              // 페이지 또는 DB에서 탭 파라미터를 찾는다.
              const tabParam =
                Object.values(pages).find((p) => p.displayName === id) ??
                (await db?.books.get(id))
              // 탭 파라미터가 존재하면 탭 배열에 추가한다.
              if (tabParam) tabs.push(tabParam)
            }
          }

          // 탭 배열이 비어있지 않은 경우 드롭 위치에 따라 처리한다.
          if (tabs.length) {
            switch (position) {
              case 'left':
                reader.addGroup(tabs, index)
                break
              case 'right':
                reader.addGroup(tabs, index + 1)
                break
              default:
                tabs.forEach((t) => reader.addTab(t, index))
            }
          }
        }}
      >
        {group.tabs.map((tab, i) => (
          <PaneContainer active={i === selectedIndex} key={tab.id}>
            {tab instanceof BookTab ? (
              <BookPane tab={tab} onMouseDown={handleMouseDown} />
            ) : (
              <tab.Component />
            )}
          </PaneContainer>
        ))}
      </DropZone>
    </div>
  )
}

interface PaneContainerProps {
  active: boolean
}
const PaneContainer: React.FC<PaneContainerProps> = ({ active, children }) => {
  return <div className={clsx('h-full', active || 'hidden')}>{children}</div>
}

interface BookPaneProps {
  tab: BookTab
  onMouseDown: () => void
}

function BookPane({ tab, onMouseDown }: BookPaneProps) {
  // DOM 요소에 접근하기 위한 ref
  const ref = useRef<HTMLDivElement>(null)

  // 이전 크기를 저장하는 ref
  const prevSize = useRef(0)

  const typography = useTypography(tab)
  const { dark } = useColorScheme()
  const [background] = useBackground()

  const { iframe, rendition, rendered, container } = useSnapshot(tab)

  // 개발 모드에서 컴포넌트 렌더링 로그를 출력한다.
  useTilg()

  /**
   * 패널의 크기 변화를 감지하여 리더를 리사이징하는 효과
   * ResizeObserver를 사용하여 패널의 크기 변화를 감지하고,
   * 크기가 변경되면 reader.resize()를 호출한다.
   */
  useEffect(() => {
    // 현재 DOM 요소를 가져온다.
    const el = ref.current
    if (!el) return

    // ResizeObserver를 생성하여 크기 변화를 감지한다.
    const observer = new ResizeObserver(([e]) => {
      // 현재 너비를 가져온다. 값이 없으면 0으로 설정한다.
      const size = e?.contentRect.width ?? 0
      // `display: hidden` will lead `rect` to 0
      // 현재 크기와 이전 크기가 모두 0이 아닌 경우에만 리사이징한다.
      if (size !== 0 && prevSize.current !== 0) {
        reader.resize()
      }
      // 이전 크기를 현재 크기로 업데이트한다.
      prevSize.current = size
    })
    // 요소에 관찰자를 연결한다.
    observer.observe(el)
    // 컴포넌트 언마운트 시 관찰자를 해제한다.
    return () => {
      observer.disconnect()
    }
  }, [])

  // 탭 동기화 훅을 사용한다.
  useSync(tab)

  const setNavbar = useSetRecoilState(navbarState)
  const mobile = useMobile()

  const applyCustomStyle = useCallback(() => {
    // rendition의 첫 번째 콘텐츠를 가져온다.
    const contents = rendition?.getContents()[0]
    // 콘텐츠와 타이포그래피 설정으로 사용자 정의 스타일을 업데이트한다.
    updateCustomStyle(contents, typography)
  }, [rendition, typography])

  // 탭이 렌더링될 때 사용자 정의 스타일을 적용하도록 설정한다.
  useEffect(() => {
    tab.onRender = applyCustomStyle
  }, [applyCustomStyle, tab])

  // ref.current가 존재하면 tab.render 메서드를 호출하여 해당 요소에 탭을 렌더링한다.
  useEffect(() => {
    if (ref.current) tab.render(ref.current)
  }, [tab])

  useEffect(() => {
    /**
     * when `spread` changes, we should call `spread()` to re-layout,
     * then call {@link updateCustomStyle} to update custom style
     * according to the latest layout
    
     * spread가 변경되면 re-layout을 위해 spread()를 호출하고,
     * 최신 레이아웃에 따라 사용자 정의 스타일을 업데이트하기 위해
     * updateCustomStyle을 호출한다.
     */
    rendition?.spread(typography.spread ?? RenditionSpread.Auto)
  }, [typography.spread, rendition])

  // applyCustomStyle 함수의 의존성이 변경될 때마다 함수를 호출하여 사용자 정의 스타일을 적용한다.
  useEffect(() => applyCustomStyle(), [applyCustomStyle])
  // 상태에 따라 rendition의 테마 색상을 설정한다. 다크 모드에서는 밝은 색상으로, 라이트 모드에서는 어두운 색상으로 설정한다.
  useEffect(() => {
    if (dark === undefined) return
    // set `!important` when in dark mode
    rendition?.themes.override('color', dark ? '#bfc8ca' : '#3f484a', dark)
  }, [rendition, dark])

  // 이미지 소스 상태를 관리한다.
  const [src, setSrc] = useState<string>()

  /**
   * 이미지 소스가 설정될 때 활성 요소의 포커스를 해제하는 효과
   * src가 설정되면 현재 활성 요소의 포커스를 해제한다.
   */
  useEffect(() => {
    if (src) {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement?.blur()
    }
  }, [src])

  // 드래그 이벤트 컨텍스트를 가져온다.
  const { setDragEvent } = useDndContext()

  /**
   * iframe에서 dragover 이벤트가 발생하면 setDragEvent를 호출하여 드래그 이벤트를 설정한다.
   * iframe에서는 dragenter 이벤트가 짝수 번째에 발생하지 않으므로 대신 dragover 이벤트를 사용한다.
   */
  // `dragenter` not fired in iframe when the count of times is even, so use `dragover`
  useEventListener(iframe, 'dragover', (e: any) => {
    console.log('drag enter in iframe')
    setDragEvent(e)
  })

  // iframe에서 mousedown 이벤트가 발생하면 onMouseDown 콜백을 호출한다.
  useEventListener(iframe, 'mousedown', onMouseDown)

  // iframe의 click 이벤트 핸들러
  useEventListener(iframe, 'click', (e) => {
    // Chrome의 tap-to-search 기능을 방지한다.
    // https://developer.chrome.com/blog/tap-to-search
    e.preventDefault()

    // 이벤트 경로의 모든 요소를 순회한다.
    for (const el of e.composedPath() as any) {
      // iframe에서는 instanceof가 작동하지 않을 수 있어 tagName을 사용한다.
      // `instanceof` may not work in iframe
      if (el.tagName === 'A' && el.href) {
        tab.showPrevLocation()
        return
      }
      // 모바일이 아니고 blob URL 형식의 이미지를 클릭한 경우
      if (
        mobile === false &&
        el.tagName === 'IMG' &&
        el.src.startsWith('blob:')
      ) {
        setSrc(el.src)
        return
      }
    }
    // 터치 화면이고 컨테이너가 존재하는 경우
    if (isTouchScreen && container) {
      // 주석을 클릭한 경우
      if (getClickedAnnotation()) {
        setClickedAnnotation(false)
        return
      }
      // 화면의 너비를 가져온다.
      const w = container.clientWidth
      // 클릭 위치의 X 좌표를 화면 너비로 나눈 나머지를 계산한다.
      const x = e.clientX % w
      // 화면 가장자리 영역의 비율을 정의한다.
      const threshold = 0.3
      // 가장자리 영역의 너비를 계산한다.
      const side = w * threshold

      // 왼쪽 가장자리를 클릭한 경우 이전 페이지로 이동한다.
      if (x < side) {
        tab.prev()
        // 오른쪽 가장자리를 클릭한 경우 다음 페이지로 이동한다.
      } else if (w - x < side) {
        tab.next()
        // 모바일에서 중앙 영역을 클릭한 경우 네비게이션 바를 토글한다.
      } else if (mobile) {
        setNavbar((a) => !a)
      }
    }
  })

  // 위로 스크롤하면 이전 페이지, 아래로 스크롤하면 다음 페이지로 이동한다.
  useEventListener(iframe, 'wheel', (e) => {
    if (e.deltaY < 0) {
      tab.prev()
    } else {
      tab.next()
    }
  })

  // 키보드 이벤트에 따라 페이지를 이동한다.
  useEventListener(iframe, 'keydown', handleKeyDown(tab))

  /**
   * iframe의 touchstart 이벤트 핸들러 구현
   * 터치 시작 시 위치와 시간을 기록하고, 터치 종료 시 스와이프 방향에 따라 페이지를 이동하는 로직을 구현한다.
   */
  useEventListener(iframe, 'touchstart', (e) => {
    // 터치 시작 위치의 x, y 좌표를 저장한다. 값이 없으면 0으로 설정한다.
    const x0 = e.targetTouches[0]?.clientX ?? 0
    const y0 = e.targetTouches[0]?.clientY ?? 0
    // 터치 시작 시간을 기록한다.
    const t0 = Date.now()

    if (!iframe) return

    /** 
      When selecting text with long tap, `touchend` is not fired,
      so instead of use `addEventlistener`, we should use `on*`
      to remove the previous listener.
      텍스트를 길게 탭하여 선택할 때 touchend가 발생하지 않으므로,
      addEventListener 대신 on* 속성을 사용하여 이전 리스너를 제거한다.
     */
    iframe.ontouchend = function handleTouchEnd(e: TouchEvent) {
      // 이벤트 처리 후 리스너를 제거한다.
      iframe.ontouchend = undefined
      // iframe 내 현재 선택된 텍스트가 있는지 확인한다.
      const selection = iframe.getSelection()
      // 선택된 텍스트가 있으면 페이지 이동을 하지 않고 함수를 종료한다.
      if (hasSelection(selection)) return

      // 터치 종료 위치의 x, y 좌표를 저장한다. 값이 없으면 0으로 설정한다.
      const x1 = e.changedTouches[0]?.clientX ?? 0
      const y1 = e.changedTouches[0]?.clientY ?? 0
      // 터치 종료 시간을 기록한다.
      const t1 = Date.now()

      // x, y 방향으로의 이동 거리를 계산한다.
      const deltaX = x1 - x0
      const deltaY = y1 - y0
      // 터치 지속 시간을 계산한다.
      const deltaT = t1 - t0

      // x,y 방향 이동 거리의 절댓값을 계산한다.
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // x 방향 이동이 너무 작으면 페이지 이동을 하지 않는다.
      if (absX < 10) return

      // y 방향 이동이 x 방향 이동보다 2배 이상 크면 세로 스크롤로 간주한다.
      if (absY / absX > 2) {
        // 터치 시간이 너무 길거나 x 방향 이동이 너무 작으면 페이지 이동을 하지 않는다.
        if (deltaT > 100 || absX < 30) {
          return
        }
      }

      // 오른쪽으로 스와이프하면 이전 페이지로 이동한다.
      if (deltaX > 0) {
        tab.prev()
      }
      // 왼쪽으로 스와이프하면 다음 페이지로 이동한다.
      if (deltaX < 0) {
        tab.next()
      }
    }
  })

  useDisablePinchZooming(iframe)

  return (
    <div className={clsx('flex h-full flex-col', mobile && 'py-[3vw]')}>
      <PhotoSlider
        images={[{ src, key: 0 }]}
        visible={!!src}
        onClose={() => setSrc(undefined)}
        maskOpacity={0.6}
        bannerVisible={false}
      />
      <ReaderPaneHeader tab={tab} />
      <div
        ref={ref}
        className={clsx('relative flex-1', isTouchScreen || 'h-0')}
        // `color-scheme: dark` will make iframe background white
        style={{ colorScheme: 'auto' }}
      >
        <div
          className={clsx(
            'absolute inset-0',
            // do not cover `sash`
            'z-20',
            rendered && 'hidden',
            background,
          )}
        />
        <TextSelectionMenu tab={tab} />
        <Annotations tab={tab} />
      </div>
      <ReaderPaneFooter tab={tab} />
    </div>
  )
}

interface ReaderPaneHeaderProps {
  tab: BookTab
}
const ReaderPaneHeader: React.FC<ReaderPaneHeaderProps> = ({ tab }) => {
  // 책의 현재 위치 정보를 가져온다.
  const { location } = useSnapshot(tab)
  // 책의 네비게이션 경로를 가져온다.
  const navPath = tab.getNavPath()

  // navPath의 각 항목에 expanded=true를 설정하여 펼친 상태로 표시한다.
  useEffect(() => {
    navPath.forEach((i) => (i.expanded = true))
  }, [navPath])

  return (
    <Bar>
      <div className="scroll-h flex">
        {navPath.map((item, i) => (
          <button
            key={i}
            className="hover:text-on-surface flex shrink-0 items-center"
          >
            {item.label}
            {i !== navPath.length - 1 && <MdChevronRight size={20} />}
          </button>
        ))}
      </div>
      {location && (
        <div className="shrink-0">
          {location.start.displayed.page} / {location.start.displayed.total}
        </div>
      )}
    </Bar>
  )
}

interface FooterProps {
  tab: BookTab
}
// 책의 현재 위치, 진행률, 이전 위치로 돌아가는 버튼 등을 표시하는 푸터 컴포넌트
const ReaderPaneFooter: React.FC<FooterProps> = ({ tab }) => {
  const { locationToReturn, location, book } = useSnapshot(tab)

  return (
    <Bar>
      {locationToReturn ? (
        <>
          <button
            className={clsx(locationToReturn || 'invisible')}
            onClick={() => {
              // 이전 위치 정보를 숨긴다.
              tab.hidePrevLocation()
              // 이전 위치로 이동한다. 두 번째 인자 false는 애니메이션 없이 이동함을 의미한다.
              tab.display(locationToReturn.end.cfi, false)
            }}
          >
            Return to {locationToReturn.end.cfi}
          </button>
          <button
            onClick={() => {
              tab.hidePrevLocation()
            }}
          >
            Stay
          </button>
        </>
      ) : (
        <>
          <div>{location?.start.href}</div>
          <div>{((book.percentage ?? 0) * 100).toFixed()}%</div>
        </>
      )}
    </Bar>
  )
}

interface LineProps extends ComponentProps<'div'> {}
const Bar: React.FC<LineProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        'typescale-body-small text-outline flex h-6 items-center justify-between gap-2 px-[4vw] sm:px-2',
        className,
      )}
      {...props}
    ></div>
  )
}
