/**
 * @author ☯채종민
 * @description PaneView 컴포넌트는 확장/축소가 가능한 패널 뷰를 제공합니다.
 * SplitView를 기반으로 하며, 각 패널은 제목, 액션 버튼, 그리고 확장/축소 기능을 가집니다.
 * VS Code의 사이드바 패널과 유사한 UI/UX를 제공합니다.
 */

import clsx from 'clsx'
import { ComponentProps, forwardRef, useState } from 'react'

import { scale } from '@flow/reader/platform'

import { Twisty } from '../Row'
import { Action, ActionBar } from '../base'

import { SplitView, useSplitViewItem } from './SplitView'

/**
 * 개별 패널(Pane)의 Props 인터페이스
 * @interface PaneProps
 * @extends {ComponentProps<'div'>} - div 엘리먼트의 기본 props를 상속
 * @property {string} headline - 패널의 제목
 * @property {number} [preferredSize] - 패널의 선호 크기 (픽셀 단위)
 * @property {Action[]} [actions] - 패널 헤더에 표시될 액션 버튼들
 */
interface PaneProps extends ComponentProps<'div'> {
  headline: string
  preferredSize?: number
  actions?: Action[]
}

/**
 * Pane 컴포넌트 - 확장/축소 가능한 개별 패널
 * forwardRef를 사용하여 부모 컴포넌트에서 내부 div에 접근 가능하도록 함
 *
 * @param {PaneProps} props - 패널 속성
 * @param {React.Ref<HTMLDivElement>} ref - 패널 내부 div에 대한 ref
 */
export const Pane = forwardRef<HTMLDivElement, PaneProps>(function Pane(
  { className, headline, preferredSize, children, actions, ...props },
  ref,
) {
  // 패널의 확장/축소 상태 관리
  const [expanded, setExpanded] = useState(true)

  // SplitView와 연동하여 패널 크기 관리
  const { size } = useSplitViewItem(headline, {
    preferredSize,
    visible: expanded,
  })

  return (
    <div
      className={clsx('Pane scroll-parent group', size && 'shrink-0')}
      style={{
        // 확장 상태에 따라 높이 조절 (축소 시 헤더만 표시)
        height: expanded ? size : 24,
      }}
    >
      {/* 패널 헤더 영역 */}
      <div
        role="button"
        className="flex h-6 shrink-0 items-center"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* 확장/축소 아이콘 */}
        <Twisty expanded={expanded} />

        {/* 패널 제목 */}
        <div
          className="typescale-label-small text-on-surface-variant !font-bold"
          style={{ fontSize: scale(11, 12) }}
        >
          {headline.toUpperCase()}
        </div>

        {/* 액션 버튼 영역 - 호버 시에만 표시 */}
        {actions && (
          <ActionBar
            actions={actions}
            className="invisible ml-auto flex pr-1 group-hover:visible"
          />
        )}
      </div>

      {/* 패널 컨텐츠 영역 */}
      <div
        ref={ref}
        className={clsx(
          'scroll typescale-body-small text-on-surface-variant',
          !expanded && 'hidden', // 축소 상태에서 숨김
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
})

/**
 * PaneView 컴포넌트의 Props 인터페이스
 * @interface PaneViewProps
 * @extends {ComponentProps<'div'>}
 * @property {string} name - 뷰의 식별자
 * @property {string} title - 뷰의 제목 (툴팁으로 표시)
 * @property {Action[]} [actions] - 뷰 헤더에 표시될 액션 버튼들
 */
export interface PaneViewProps extends ComponentProps<'div'> {
  name: string
  title: string
  actions?: Action[]
}

/**
 * PaneView 컴포넌트 - 여러 패널을 수직으로 배치하는 컨테이너
 * 헤더와 수직 분할된 패널들로 구성됨
 *
 * @param {PaneViewProps} props - PaneView 속성
 */
export function PaneView({
  className,
  name,
  title,
  actions,
  ...props
}: PaneViewProps) {
  return (
    <>
      {/* PaneView 헤더 */}
      <div
        className={clsx(
          'flex items-center justify-between px-5 py-2.5',
          className,
        )}
      >
        {/* 뷰 제목 */}
        <h2
          title={title}
          className="text-on-surface"
          style={{ fontSize: scale(11, 12) }}
        >
          {name?.toUpperCase()}
        </h2>

        {/* 액션 버튼 영역 */}
        {actions && <ActionBar actions={actions} className="-mr-1" />}
      </div>

      {/* 수직 분할된 패널 컨테이너 */}
      <SplitView
        vertical
        className={clsx('scroll-parent', className)}
        {...props}
      />
    </>
  )
}
