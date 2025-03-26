/**
 * @author 한상우
 * @description 전자책의 목차(TOC)와 라이브러리를 표시하는 컴포넌트
 */

/**
 *
 * 이 파일은 책의 목차와 사용자의 책 라이브러리를 표시하는 인터페이스를 제공합니다.
 * 목차는 계층적으로 표시되며 각 항목을 클릭하면 해당 위치로 이동할 수 있습니다.
 * 모바일이 아닌 환경에서는 라이브러리도 함께 표시됩니다.
 *
 * ■ 주요 컴포넌트:
 * 1. TocView - 최상위 컴포넌트
 * 2. LibraryPane - 책 라이브러리를 표시하는 패널
 * 3. TocPane - 책 목차를 표시하는 패널
 * 4. TocRow - 개별 목차 항목을 표시하는 컴포넌트
 *
 * ■ 주요 기능:
 * - 책의 목차를 계층적으로 표시
 * - 목차 항목 클릭 시 해당 위치로 이동
 * - 모든 목차 항목 확장/축소 기능
 * - 라이브러리에서 책 선택 및 드래그 기능
 */

import { StateLayer } from '@literal-ui/core'
import { useMemo } from 'react'
import { VscCollapseAll, VscExpandAll } from 'react-icons/vsc'

import {
  useLibrary,
  useList,
  useMobile,
  useTranslation,
} from '@flow/reader/hooks'
import {
  compareHref,
  dfs,
  flatTree,
  INavItem,
  reader,
  useReaderSnapshot,
} from '@flow/reader/models'

import { Row } from '../Row'
import { PaneViewProps, PaneView, Pane } from '../base'

/**
 * TocView 컴포넌트
 *
 * 목차와 라이브러리를 표시하는 최상위 컴포넌트입니다.
 * 모바일 환경에서는 라이브러리 패널을 표시하지 않습니다.
 */
export const TocView: React.FC<PaneViewProps> = (props) => {
  const mobile = useMobile() // 모바일 환경 여부 체크

  return (
    <PaneView {...props}>
      {mobile || <LibraryPane />}{' '}
      {/* 모바일이 아닐 경우에만 라이브러리 패널 표시 */}
      <TocPane />
    </PaneView>
  )
}

/**
 * LibraryPane 컴포넌트
 *
 * 사용자의 책 라이브러리를 표시하는 패널 컴포넌트입니다.
 * 각 책은 클릭하여 열거나 드래그하여 다른 뷰로 이동할 수 있습니다.
 */
const LibraryPane: React.FC = () => {
  const books = useLibrary() // 라이브러리 책 목록 가져오기
  const t = useTranslation('toc')

  return (
    <Pane headline={t('library')} preferredSize={240}>
      {books?.map((book) => (
        <button
          key={book.id}
          className="relative w-full truncate py-1 pl-5 pr-3 text-left"
          title={book.name}
          draggable
          onClick={() => reader.addTab(book)} // 클릭 시 해당 책의 탭 추가
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', book.id) // 드래그 시 책 ID 설정
          }}
        >
          <StateLayer />
          {book.name}
        </button>
      ))}
    </Pane>
  )
}

/**
 * TocPane 컴포넌트
 *
 * 책의 목차(Table of Contents)를 표시하는 패널 컴포넌트입니다.
 * 계층적인 목차 구조를 표시하고, 모든 항목을 확장/축소할 수 있는 기능을 제공합니다.
 */
const TocPane: React.FC = () => {
  const t = useTranslation()
  const { focusedBookTab } = useReaderSnapshot()

  // 평면화된 목차 항목 배열 생성 (계층 구조를 1차원 배열로 변환)
  const toc = focusedBookTab?.nav?.toc as INavItem[] | undefined
  const rows = useMemo(() => toc?.flatMap((i) => flatTree(i)), [toc])

  // 목차 항목 중 하나라도 확장되어 있는지 확인
  const expanded = toc?.some((r) => r.expanded)
  const currentNavItem = focusedBookTab?.currentNavItem

  // 가상화된 목록을 위한 useList 훅 사용
  const { outerRef, innerRef, items, scrollToItem } = useList(rows)

  return (
    <Pane
      headline={t('toc.title')}
      ref={outerRef}
      actions={[
        {
          id: expanded ? 'collapse-all' : 'expand-all',
          title: t(expanded ? 'action.collapse_all' : 'action.expand_all'),
          Icon: expanded ? VscCollapseAll : VscExpandAll,
          handle() {
            // 모든 목차 항목의 확장 상태를 토글
            reader.focusedBookTab?.nav?.toc?.forEach((r) =>
              dfs(r as INavItem, (i) => (i.expanded = !expanded)),
            )
          },
        },
      ]}
    >
      {rows && (
        <div ref={innerRef}>
          {items.map(({ index }) => (
            <TocRow
              key={index}
              currentNavItem={currentNavItem as INavItem}
              item={rows[index]}
              onActivate={() => scrollToItem(index)} // 활성화 시 해당 항목으로 스크롤
            />
          ))}
        </div>
      )}
    </Pane>
  )
}

interface TocRowProps {
  currentNavItem?: INavItem
  item?: INavItem
  onActivate: () => void
}

/**
 * TocRow 컴포넌트
 *
 * 개별 목차 항목을 표시하는 컴포넌트입니다.
 * 항목을 클릭하면 해당 위치로 이동하고, 하위 항목이 있는 경우 확장/축소할 수 있습니다.
 *
 * @param currentNavItem - 현재 선택된 네비게이션 항목
 * @param item - 표시할 목차 항목
 * @param onActivate - 항목이 활성화될 때 호출할 함수
 */
const TocRow: React.FC<TocRowProps> = ({
  currentNavItem,
  item,
  onActivate,
}) => {
  if (!item) return null
  const { label, subitems, depth, expanded, id, href } = item
  const tab = reader.focusedBookTab

  return (
    <Row
      title={label.trim()}
      depth={depth}
      active={href === currentNavItem?.href} // 현재 선택된 항목인지 표시
      expanded={expanded}
      subitems={subitems}
      onClick={() => {
        // href에서 id 부분 추출 (예: "chapter1.xhtml#section1" -> "section1")
        const [, id] = href.split('#')
        // href와 일치하는 섹션 찾기
        const section = tab?.sections?.find((s) => compareHref(s.href, href))

        if (!section) return

        // ID가 있으면 해당 요소로 이동, 없으면 섹션 시작으로 이동
        if (id) {
          tab?.displayFromSelector(`#${id}`, section, false)
        } else {
          tab?.display(section.href, false)
        }
      }}
      toggle={() => tab?.toggle(id)} // 확장/축소 토글
      onActivate={onActivate}
    />
  )
}
