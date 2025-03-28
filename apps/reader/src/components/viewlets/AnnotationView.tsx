/**
 * @author 한상우
 * @description 전자책 리더 애플리케이션에서 사용자의 주석과 정의를 보여주는 컴포넌트를 정의합니다
 */

/**
 *
 * 이 파일은 사용자가 책에 추가한 주석(annotations)과 정의(definitions)를
 * 보여주고 관리하는 인터페이스를 제공합니다.
 *
 * ■ 주요 컴포넌트:
 * 1. AnnotationView - 최상위 컴포넌트
 * 2. DefinitionPane - 사용자 정의 용어를 보여주는 패널
 * 3. AnnotationPane - 사용자 주석을 보여주는 패널
 * 4. AnnotationBlock - 각 섹션별 주석 그룹을 표시
 *
 * ■ 주요 기능:
 * - 책의 모든 주석과 정의를 섹션별로 정리하여 표시
 * - 주석을 마크다운 형식으로 내보내기
 * - 주석과 정의 삭제 기능
 * - 주석 클릭 시 해당 위치로 이동
 */

import { useBoolean } from '@literal-ui/hooks'
import React, { Fragment } from 'react'
import { useMemo } from 'react'
import { VscCopy } from 'react-icons/vsc'

import { Annotation } from '@flow/reader/annotation'
import { useTranslation } from '@flow/reader/hooks'
import { reader, useReaderSnapshot } from '@flow/reader/models'
import { copy, group, keys } from '@flow/reader/utils'

import { Row } from '../Row'
import { PaneViewProps, PaneView, Pane } from '../base'

/**
 * AnnotationView 컴포넌트
 *
 * 정의(Definition)와 주석(Annotation) 패널을 포함하는 최상위 컴포넌트입니다.
 * PaneView를 사용하여 두 패널을 수직으로 배치합니다.
 */
export const AnnotationView: React.FC<PaneViewProps> = (props) => {
  return (
    <PaneView {...props}>
      <DefinitionPane />
      <AnnotationPane />
    </PaneView>
  )
}

/**
 * DefinitionPane 컴포넌트
 *
 * 사용자가 정의한 용어 목록을 표시하는 패널입니다.
 * 각 정의는 Row 컴포넌트로 표시되며, 삭제 기능을 제공합니다.
 */
const DefinitionPane: React.FC = () => {
  // 현재 포커스된 책 탭의 정보를 가져옵니다.
  const { focusedBookTab } = useReaderSnapshot()
  // 다국어 지원을 위한 번역 함수를 가져옵니다.
  const t = useTranslation('annotation')

  return (
    <Pane headline={t('definitions')} preferredSize={120}>
      {focusedBookTab?.book.definitions.map((d) => {
        return (
          <Row
            key={d}
            onDelete={() => {
              // 삭제 버튼 클릭 시 해당 정의를 제거합니다.
              reader.focusedBookTab?.undefine(d)
            }}
          >
            {d}
          </Row>
        )
      })}
    </Pane>
  )
}

/**
 * AnnotationPane 컴포넌트
 *
 * 사용자가 추가한 주석 목록을 표시하는 패널입니다.
 * 주석은 섹션별로 그룹화되어 AnnotationBlock 컴포넌트로 표시됩니다.
 * 모든 주석을 마크다운 형식으로 내보내는 기능도 제공합니다.
 */
const AnnotationPane: React.FC = () => {
  const { focusedBookTab } = useReaderSnapshot()
  const t = useTranslation('annotation')

  /**
   * 현재 책의 주석 목록을 메모이제이션합니다.
   * focusedBookTab?.book.annotations가 변경될 때만 재계산되어 성능을 최적화합니다.
   */
  const annotations = useMemo(
    () => (focusedBookTab?.book.annotations as Annotation[]) ?? [],
    [focusedBookTab?.book.annotations],
  )

  /**
   * 주석을 스파인 인덱스(책의 섹션 인덱스)별로 그룹화합니다.
   * 이를 통해 주석을 책의 구조에 맞게 섹션별로 정리하여 표시할 수 있습니다.
   */
  const groupedAnnotation = useMemo(() => {
    return group(annotations ?? [], (a) => a.spine.index)
  }, [annotations])

  /**
   * 주석을 마크다운 형식으로 내보내는 함수
   *
   * 모든 주석을 챕터별로 그룹화하고 마크다운 형식으로 변환하여 클립보드에 복사합니다.
   * 예시 형식:
   * ## 챕터 제목
   * - 주석 텍스트 (노트 내용)
   * - 주석 텍스트
   */
  const exportAnnotations = () => {
    // 주석을 챕터(spine.title)별로 그룹화합니다.
    const grouped = group(annotations, (a) => a.spine.title)
    const exported: Record<string, any[]> = {}

    // 각 챕터의 주석 정보를 처리합니다.
    for (const chapter in grouped) {
      const annotations =
        grouped[chapter]?.map((a) => {
          const annotation: Record<string, any> = {}
          if (a.notes !== undefined) annotation.notes = a.notes
          if (a.text !== undefined) annotation.text = a.text
          return annotation
        }) ?? []
      exported[chapter] = annotations
    }

    // 마크다운 형식으로 변환하여 클립보드에 복사합니다.
    const exportedAnnotationsMd = Object.entries(exported)
      .map(([chapter, annotations]) => {
        return `## ${chapter}\n${annotations
          .map((a) => `- ${a.text} ${a.notes ? `(${a.notes})` : ''}`)
          .join('\n')}`
      })
      .join('\n\n')
    copy(exportedAnnotationsMd)
  }

  return (
    <Pane
      headline={t('annotations')}
      actions={
        annotations.length > 0
          ? [
              {
                id: 'copy-all',
                title: t('copy_as_markdown'),
                Icon: VscCopy,
                handle() {
                  exportAnnotations()
                },
              },
            ]
          : undefined
      }
    >
      {/* 그룹화된 주석을 섹션별로 AnnotationBlock 컴포넌트로 렌더링합니다. */}
      {keys(groupedAnnotation).map((k) => (
        <AnnotationBlock key={k} annotations={groupedAnnotation[k]!} />
      ))}
    </Pane>
  )
}

interface AnnotationBlockProps {
  annotations: Annotation[]
}

/**
 * AnnotationBlock 컴포넌트
 *
 * 같은 섹션에 속한 주석 그룹을 표시하는 컴포넌트입니다.
 * 확장/축소 가능한 UI를 제공하여 사용자가 필요한 섹션의 주석만 볼 수 있게 합니다.
 *
 * @param annotations - 표시할 주석 배열
 */
const AnnotationBlock: React.FC<AnnotationBlockProps> = ({ annotations }) => {
  // 확장/축소 상태를 관리합니다. 기본값은 확장(true)입니다.
  const [expanded, toggle] = useBoolean(true)

  return (
    <div>
      {/* 섹션 제목 행 - 클릭 시 확장/축소 토글 */}
      <Row
        depth={1}
        badge
        expanded={expanded}
        toggle={toggle}
        subitems={annotations}
      >
        {annotations[0]?.spine.title}
      </Row>

      {/* 확장된 상태일 때만 주석 목록을 표시합니다. */}
      {expanded && (
        <div>
          {annotations.map((a) => (
            <Fragment key={a.id}>
              {/* 주석 텍스트 행 */}
              <Row
                depth={2}
                onClick={() => {
                  // 클릭 시 해당 주석 위치로 이동합니다.
                  reader.focusedBookTab?.display(a.cfi)
                }}
                onDelete={() => {
                  // 삭제 버튼 클릭 시 주석을 제거합니다.
                  reader.focusedBookTab?.removeAnnotation(a.cfi)
                }}
              >
                {a.text}
              </Row>

              {/* 주석에 노트가 있는 경우 추가 행으로 표시합니다. */}
              {a.notes && (
                <Row
                  depth={3}
                  onClick={() => {
                    reader.focusedBookTab?.display(a.cfi)
                  }}
                >
                  <span className="text-outline">{a.notes}</span>
                </Row>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
