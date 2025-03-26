/**
 * @author 한상우
 * @description 전자책 내용을 검색하고 결과를 표시하는 컴포넌트
 */
/**
 *
 * 이 파일은 책 내용에서 텍스트를 검색하고 결과를 섹션별로 정리하여 보여주는
 * 인터페이스를 제공합니다. 검색 결과는 계층적으로 표시되며 사용자는 각 결과를
 * 클릭하여 해당 위치로 이동할 수 있습니다.
 *
 * ■ 주요 컴포넌트:
 * 1. SearchView - 최상위 검색 컴포넌트
 * 2. ResultList - 검색 결과 목록을 표시
 * 3. ResultRow - 개별 검색 결과 항목을 표시
 *
 * ■ 주요 기능:
 * - 텍스트 검색 입력 필드
 * - 검색 결과의 계층적 표시
 * - 모든 결과 확장/축소 기능
 * - 결과 클릭 시 해당 위치로 이동
 * - 검색어 하이라이트 표시
 */

import { useState, useEffect, useMemo } from 'react'
import Highlighter from 'react-highlight-words'
import { VscCollapseAll, VscExpandAll } from 'react-icons/vsc'

import { useAction, useList, useTranslation } from '@flow/reader/hooks'
import {
  flatTree,
  IMatch,
  useReaderSnapshot,
  reader,
} from '@flow/reader/models'

import { TextField } from '../Form'
import { Row } from '../Row'
import { PaneViewProps, PaneView } from '../base'

/**
 * useIntermediateKeyword 커스텀 훅
 *
 * IME(입력기) 사용 시 발생하는 렌더링 문제를 해결하기 위한 중간 상태 관리 훅입니다.
 *
 * valtio를 사용할 때 IME 입력 중에 예상치 못한 렌더링이 발생하는 문제를 해결합니다.
 * React의 useState를 사용하여 중간 상태를 관리하고, 이를 focusedBookTab의 keyword와 동기화합니다.
 *
 * ■ 특이사항:
 * - IME(Input Method Editor): 한글, 중국어, 일본어 등의 입력 시 사용하는 입력기
 * - IME 입력 중에는 글자가 완성되기 전 중간 상태가 존재함
 * - valtio는 프록시 기반이라 이러한 중간 상태 변화를 감지하면 화면이 깜빡일 수 있음
 * - useState로 로컬 상태를 만들어 완성된 입력만 반영하도록 함
 *
 * 반환값: [현재 키워드, 키워드 설정 함수]
 */
function useIntermediateKeyword() {
  const [keyword, setKeyword] = useState('')
  const { focusedBookTab } = useReaderSnapshot()

  // focusedBookTab의 keyword가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setKeyword(focusedBookTab?.keyword ?? '')
  }, [focusedBookTab?.keyword])

  // 로컬 상태가 변경되면 focusedBookTab의 keyword 업데이트
  useEffect(() => {
    reader.focusedBookTab?.setKeyword(keyword)
  }, [keyword])

  return [keyword, setKeyword] as const
}

/**
 * SearchView 컴포넌트
 *
 * 검색 기능을 제공하는 최상위 컴포넌트입니다.
 * 검색어 입력 필드와 검색 결과 목록을 포함합니다.
 */
export const SearchView: React.FC<PaneViewProps> = (props) => {
  const [action] = useAction()
  const { focusedBookTab } = useReaderSnapshot()
  const t = useTranslation()

  // 중간 키워드 상태 관리를 위한 커스텀 훅 사용
  const [keyword, setKeyword] = useIntermediateKeyword()

  const results = focusedBookTab?.results
  // 검색 결과 중 하나라도 expanded가 true인지 확인
  const expanded = results?.some((r) => r.expanded)

  return (
    <PaneView
      actions={[
        {
          id: expanded ? 'collapse-all' : 'expand-all',
          title: t(expanded ? 'action.collapse_all' : 'action.expand_all'),
          Icon: expanded ? VscCollapseAll : VscExpandAll,
          handle() {
            // 모든 검색 결과의 확장 상태를 토글합니다
            reader.focusedBookTab?.results?.forEach(
              (r) => (r.expanded = !expanded),
            )
          },
        },
      ]}
      {...props}
    >
      <div className="scroll-parent">
        <div className="px-5 py-px">
          <TextField
            as="input"
            name="keyword"
            autoFocus={action === 'search'} // 'search' 액션일 경우 자동 포커스
            hideLabel
            value={keyword}
            placeholder={t('search.title')}
            onChange={(e) => setKeyword(e.target.value)}
            onClear={() => setKeyword('')}
          />
        </div>
        {keyword && results && (
          <ResultList results={results as IMatch[]} keyword={keyword} />
        )}
      </div>
    </PaneView>
  )
}

interface ResultListProps {
  results: IMatch[]
  keyword: string
}

/**
 * ResultList 컴포넌트
 *
 * 검색 결과 목록을 표시하는 컴포넌트입니다.
 * 섹션별로 그룹화된 검색 결과를 계층적으로 표시합니다.
 *
 * @param results - 검색 결과 배열
 * @param keyword - 검색어
 */
const ResultList: React.FC<ResultListProps> = ({ results, keyword }) => {
  // 검색 결과를 평면화하여 트리 구조로 변환합니다
  const rows = useMemo(
    () => results.flatMap((r) => flatTree(r)) ?? [],
    [results],
  )

  /**
   * useList 훅을 사용한 가상화된 목록 구현
   *
   * useList 훅은 긴 목록을 효율적으로 렌더링하기 위한 가상화(virtualization) 기능을 제공합니다.
   *
   * ■ React Ref와 가상화:
   * - outerRef: 스크롤 컨테이너에 대한 ref로, 전체 스크롤 영역을 관리합니다.
   * - innerRef: 실제 아이템들이 렌더링되는 내부 컨테이너에 대한 ref입니다.
   * - 이 두 ref는 함께 작동하여 현재 화면에 보이는 아이템만 렌더링합니다.
   *
   * ■ 가상화의 장점:
   * - 수백 또는 수천 개의 항목이 있어도 화면에 보이는 것만 렌더링하여 성능 최적화
   * - 메모리 사용량 감소 및 렌더링 시간 단축
   * - 부드러운 스크롤 경험 제공
   *
   * ■ items 배열:
   * - 현재 화면에 보이는 항목들의 정보(index)를 포함합니다.
   * - 스크롤 위치에 따라 items 배열이 동적으로 변경됩니다.
   */
  const { outerRef, innerRef, items } = useList(rows)
  const t = useTranslation('search')

  // 검색 결과 통계 (섹션 수, 결과 총 개수)
  const sectionCount = results.length
  const resultCount = results.reduce((a, r) => r.subitems!.length + a, 0)

  return (
    <>
      <div className="typescale-body-small text-outline px-5  py-2">
        {/* 검색 결과 통계 표시: "XX개 섹션에서 YY개 결과" */}
        {t('files.result')
          .replace('{n}', '' + resultCount)
          .replace('{m}', '' + sectionCount)}
      </div>
      {/* 
        outerRef를 스크롤 컨테이너에 연결
        - 이 요소는 고정된 높이를 가지며 overflow: auto 속성을 가짐
        - 스크롤 이벤트 감지 및 가시 영역 계산에 사용됨
      */}
      <div ref={outerRef} className="scroll">
        {/* 
          innerRef를 내부 컨테이너에 연결
          - 이 요소는 실제 모든 항목의 높이만큼의 공간을 차지
          - 하지만 실제로는 화면에 보이는 항목만 렌더링됨
        */}
        <div ref={innerRef}>
          {/* 현재 화면에 보이는 항목만 매핑하여 렌더링 */}
          {items.map(({ index }) => (
            <ResultRow key={index} result={rows[index]} keyword={keyword} />
          ))}
        </div>
      </div>
    </>
  )
}

interface ResultRowProps {
  result?: IMatch
  keyword: string
}

/**
 * ResultRow 컴포넌트
 *
 * 개별 검색 결과 항목을 표시하는 컴포넌트입니다.
 * 섹션 제목과 검색된 텍스트를 계층적으로 표시하며, 검색어를 하이라이트합니다.
 *
 * @param result - 검색 결과 항목
 * @param keyword - 검색어 (하이라이트에 사용)
 */
const ResultRow: React.FC<ResultRowProps> = ({ result, keyword }) => {
  if (!result) return null
  const { cfi, depth, expanded, subitems, id } = result
  let { excerpt, description } = result
  const tab = reader.focusedBookTab
  const isResult = depth === 1 // depth가 1이면 섹션 제목, 2 이상이면 실제 검색 결과

  excerpt = excerpt.trim()
  description = description?.trim()

  return (
    <Row
      title={description ? `${description} / ${excerpt}` : excerpt}
      label={excerpt}
      description={description}
      depth={depth}
      active={tab?.activeResultID === id}
      expanded={expanded}
      subitems={subitems}
      badge={isResult}
      {...(!isResult && {
        onClick: () => {
          if (tab) {
            // 결과 클릭 시 활성 결과 ID 설정 및 해당 위치로 이동
            tab.activeResultID = id
            tab.display(cfi)
          }
        },
      })}
      toggle={() => tab?.toggleResult(id)}
    >
      {/* 
        섹션 제목이 아닌 실제 검색 결과만 하이라이트 표시
        
        Highlighter 컴포넌트:
        - react-highlight-words 라이브러리의 컴포넌트
        - 텍스트 내의 특정 단어를 강조 표시하는 기능
        - searchWords: 강조할 검색어 배열
        - textToHighlight: 강조 대상이 되는 전체 텍스트
        - highlightClassName: 강조 표시된 부분에 적용할 CSS 클래스
        - autoEscape: 특수 문자를 이스케이프하여 정규식 관련 오류 방지
      */}
      {!isResult && (
        <Highlighter
          highlightClassName="match-highlight"
          searchWords={[keyword]}
          textToHighlight={excerpt}
          autoEscape
        />
      )}
    </Row>
  )
}
