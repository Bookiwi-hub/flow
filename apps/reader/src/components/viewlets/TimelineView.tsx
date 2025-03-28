/**
 * @author 한상우
 * @description 사용자의 책 읽기 타임라인을 표시하는 컴포넌트
 */

/**
 *
 * 이 파일은 사용자가 책을 읽는 동안 방문한 위치의 타임라인을 보여주는
 * 인터페이스를 제공합니다. 방문 위치를 시간순으로 표시하고, 클릭 시
 * 해당 위치로 이동할 수 있습니다.
 *
 * ■ 주요 컴포넌트:
 * - TimelineView - 타임라인을 표시하는 컴포넌트
 *
 * ■ 주요 기능:
 * - 방문 위치를 시간순으로 표시
 * - 각 항목에 시간 정보 표시
 * - 항목 클릭 시 해당 위치로 이동
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { useList, useTranslation } from '@flow/reader/hooks'
import { reader, useReaderSnapshot } from '@flow/reader/models'

import { Row } from '../Row'
import { PaneViewProps, PaneView, Pane } from '../base'

// dayjs에 상대 시간 플러그인 추가 (예: "2시간 전")
dayjs.extend(relativeTime)

/**
 * TimelineView 컴포넌트
 *
 * 사용자의 책 읽기 타임라인을 표시하는 컴포넌트입니다.
 * 방문한 위치를 시간순으로 나열하고, 각 항목을 클릭하면 해당 위치로 이동할 수 있습니다.
 */
export const TimelineView: React.FC<PaneViewProps> = (props) => {
  const { focusedBookTab } = useReaderSnapshot()
  const rows = focusedBookTab?.timeline // 타임라인 데이터 가져오기
  const { outerRef, innerRef, items } = useList(rows) // 가상화된 목록을 위한 useList 훅 사용
  const t = useTranslation('timeline')

  return (
    <PaneView {...props}>
      <Pane headline={t('title')} ref={outerRef}>
        {rows && (
          <div ref={innerRef}>
            {items.map(({ index }) => {
              const row = rows[index]
              if (!row) return null

              const { location, timestamp } = row
              const { cfi, href, displayed } = location.start
              return (
                <Row
                  key={timestamp}
                  description={displayed.page} // 페이지 번호 표시
                  info={dayjs(timestamp).format('HH:mm')} // 시간 정보 표시 (시:분 형식)
                  title={focusedBookTab.mapSectionToNavItem(href)?.label} // 섹션 제목 표시
                  onClick={() => {
                    // 클릭 시 해당 위치로 이동
                    reader.focusedBookTab?.display(cfi)
                  }}
                />
              )
            })}
          </div>
        )}
      </Pane>
    </PaneView>
  )
}
