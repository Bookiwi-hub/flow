/**
 * @author ☯채종민
 * @description ActionBar 컴포넌트 - 목차(TOC), 검색, 주석, 이미지, 타임라인, 타이포그래피, 테마 등의 주요 기능에 접근하는 아이콘 버튼들을 표시하는 컴포넌트
 * @date 2025-03-28
 */

import clsx from 'clsx'
import { ComponentProps } from 'react'
import { IconType } from 'react-icons'

import { IconButton } from '../Button'

/**
 * Action 인터페이스 - 액션바에서 사용되는 각 액션 항목을 정의합니다
 * @interface Action
 * @property {string} id - 액션의 고유 식별자
 * @property {string} title - 액션의 제목 (툴팁으로 표시됨)
 * @property {IconType} Icon - 액션 버튼에 표시될 아이콘 컴포넌트
 * @property {() => void} handle - 액션 클릭 시 실행될 핸들러 함수
 */
export interface Action {
  id: string
  title: string
  Icon: IconType
  handle: () => void
}

/**
 * ActionBar 컴포넌트의 Props 인터페이스
 * @interface ActionBarProps
 * @extends {ComponentProps<'ul'>} - ul 엘리먼트의 기본 속성을 상속
 * @property {Action[]} actions - 표시할 액션 배열
 */
interface ActionBarProps extends ComponentProps<'ul'> {
  actions: Action[]
}

/**
 * 액션바 컴포넌트 - 여러 아이콘 버튼을 행으로 표시하는 UI 요소
 * @component
 * @param {ActionBarProps} props - 컴포넌트 props
 * @param {Action[]} props.actions - 표시할 액션 목록
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @returns {JSX.Element} 액션 버튼 목록을 포함하는 ul 엘리먼트
 */
export const ActionBar: React.FC<ActionBarProps> = ({ actions, className }) => {
  return (
    <ul className={clsx('text-on-surface-variant flex gap-1', className)}>
      {actions.map(({ id, title, Icon, handle }) => (
        <li key={id} title={title}>
          <IconButton
            Icon={Icon}
            onClick={(e) => {
              e.stopPropagation() // 이벤트 버블링 방지
              handle() // 액션 핸들러 호출
            }}
          />
        </li>
      ))}
    </ul>
  )
}
