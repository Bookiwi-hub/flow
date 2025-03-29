/**
 * @author ☯채종민
 * @description Annotation 컴포넌트는 e-book 리더에서 주석, 하이라이트, 정의 등의 기능을 구현합니다.
 * 사용자가 텍스트를 하이라이트하거나, 검색 결과를 표시하거나, 단어 정의를 표시하는 등의 시각적 요소를 관리합니다.
 */
import { useEffect } from 'react'
import { useSnapshot } from 'valtio'

import { colorMap, Annotation as IAnnotation } from '../annotation'
import { useSetAction } from '../hooks'
import { BookTab, compareHref } from '../models'

/**
 * 주석 클릭 이벤트 전파 방지를 위한 전역 플래그
 * 주석을 클릭했을 때 하단 텍스트에 대한 클릭 이벤트가 발생하지 않도록 함
 */
let clickedAnnotation = false

/**
 * 주석 클릭 상태 확인 함수
 * @returns {boolean} 주석이 클릭되었는지 여부
 */
export const getClickedAnnotation = () => clickedAnnotation

/**
 * 주석 클릭 상태 설정 함수
 * @param {boolean} v - 설정할 클릭 상태 값
 */
export const setClickedAnnotation = (v: boolean) => (clickedAnnotation = v)

/**
 * FindMatches 컴포넌트 Props 인터페이스
 * @interface FindMatchProps
 * @property {BookTab} tab - 현재 활성화된 책 탭
 */
interface FindMatchProps {
  tab: BookTab
}

/**
 * FindMatches 컴포넌트 - 검색 결과 하이라이트 처리
 * 현재 페이지에서 검색 결과와 일치하는 텍스트를 하이라이트하고 클릭 이벤트를 추가
 *
 * @param {FindMatchProps} props - 컴포넌트 속성
 */
const FindMatches: React.FC<FindMatchProps> = ({ tab }) => {
  const setAction = useSetAction()
  // 현재 탭의 상태 값들을 가져옴 (반응형)
  const { rendition, results, currentHref } = useSnapshot(tab)

  useEffect(() => {
    // 현재 페이지(href)와 일치하는 검색 결과를 찾음
    const result = results?.find((r) => compareHref(currentHref, r.id))

    // 해당 페이지의 검색 결과 항목들
    const matches = result?.subitems

    // 각 검색 결과에 하이라이트 효과 적용
    matches?.forEach((m) => {
      try {
        // rendition API를 사용하여 하이라이트 적용
        const h = rendition?.annotations.highlight(
          m.cfi!, // Content Fragment Identifier - EPUB 내 특정 위치를 가리키는 식별자
          undefined, // 추가 데이터 없음
          undefined, // 추가 속성 없음
          undefined, // 클래스 이름 없음
          {
            // 노란색(yellow-500) 배경으로 하이라이트
            fill: 'rgba(234, 179, 8, 0.3)',
            'fill-opacity': 'unset',
          },
        )

        // 하이라이트된 SVG 요소 가져오기
        const g = h?.mark.element as SVGGElement

        // 클릭 이벤트 리스너 추가 - 클릭 시 전파 방지 플래그 설정
        g?.addEventListener('click', () => {
          setClickedAnnotation(true)
        })
      } catch (error) {
        // <title> 태그 내 텍스트 등 하이라이트할 수 없는 요소에 대한 예외 처리
      }
    })

    // 컴포넌트 언마운트 또는 의존성 변경 시 하이라이트 제거
    return () => {
      matches?.forEach((m) => {
        rendition?.annotations.remove(m.cfi!, 'highlight')
      })
    }
  }, [currentHref, rendition?.annotations, results, setAction])

  // 이 컴포넌트는 UI를 렌더링하지 않고 사이드 이펙트만 처리
  return null
}

/**
 * Definition 컴포넌트 Props 인터페이스
 * @interface DefinitionProps
 * @property {BookTab} tab - 현재 활성화된 책 탭
 * @property {string} definition - 하이라이트할 정의 단어
 */
interface DefinitionProps {
  tab: BookTab
  definition: string
}

/**
 * Definition 컴포넌트 - 정의된 단어 하이라이트 처리
 * 현재 페이지에서 정의된 단어와 일치하는 텍스트를 하이라이트하고 클릭 이벤트를 추가
 *
 * @param {DefinitionProps} props - 컴포넌트 속성
 */
const Definition: React.FC<DefinitionProps> = ({ tab, definition }) => {
  const setAction = useSetAction()
  // 현재 탭의 상태 값들을 가져옴 (반응형)
  const { rendition, currentHref } = useSnapshot(tab)

  useEffect(() => {
    // 현재 섹션에서 정의 단어 검색
    const result = tab.searchInSection(definition)
    const matches = result?.subitems

    // 각 일치 항목에 하이라이트 효과 적용
    matches?.forEach((m) => {
      try {
        // rendition API를 사용하여 하이라이트 적용
        const h = rendition?.annotations.highlight(
          m.cfi!,
          undefined,
          undefined,
          undefined,
          {
            // 회색(gray-600) 배경으로 하이라이트
            fill: 'rgba(75, 85, 99, 0.15)',
            'fill-opacity': 'unset',
          },
        )

        // 하이라이트된 SVG 요소 가져오기
        const g = h?.mark.element as SVGGElement

        // 클릭 이벤트 리스너 추가
        // 클릭 시 주석 범위 설정 및 전파 방지 플래그 설정
        g?.addEventListener('click', () => {
          tab.setAnnotationRange(m.cfi!)
          setClickedAnnotation(true)
        })
      } catch (error) {
        // <title> 태그 내 텍스트 등 하이라이트할 수 없는 요소에 대한 예외 처리
      }
    })

    // 컴포넌트 언마운트 또는 의존성 변경 시 하이라이트 제거
    return () => {
      matches?.forEach((m) =>
        rendition?.annotations.remove(m.cfi!, 'highlight'),
      )
    }
  }, [currentHref, definition, rendition?.annotations, setAction, tab])

  // 이 컴포넌트는 UI를 렌더링하지 않고 사이드 이펙트만 처리
  return null
}

/**
 * Annotation 컴포넌트 Props 인터페이스
 * @interface AnnotationProps
 * @property {BookTab} tab - 현재 활성화된 책 탭
 * @property {IAnnotation} annotation - 표시할 주석 객체
 */
interface AnnotationProps {
  tab: BookTab
  annotation: IAnnotation
}

/**
 * Annotation 컴포넌트 - 사용자 주석 하이라이트 처리
 * 사용자가 추가한 주석을 표시하고 클릭 이벤트를 추가
 *
 * @param {AnnotationProps} props - 컴포넌트 속성
 */
const Annotation: React.FC<AnnotationProps> = ({ tab, annotation }) => {
  // 현재 탭의 rendition 상태를 가져옴 (반응형)
  const { rendition } = useSnapshot(tab)

  useEffect(() => {
    // 주석 타입에 따라 rendition API를 사용하여 하이라이트 적용
    // annotation.type은 'highlight', 'underline' 등이 될 수 있음
    const h = rendition?.annotations[annotation.type](
      annotation.cfi,
      undefined,
      undefined,
      undefined,
      {
        // 주석 색상 적용 (colorMap에서 선택된 색상 사용)
        fill: colorMap[annotation.color],
        'fill-opacity': '0.5',
      },
    )

    // 하이라이트된 SVG 요소 가져오기
    const g = h?.mark?.element as SVGGElement

    // 클릭 이벤트 리스너 추가
    // 클릭 시 주석 범위 설정 및 전파 방지 플래그 설정
    g?.addEventListener('click', () => {
      tab.setAnnotationRange(annotation.cfi)
      setClickedAnnotation(true)
    })

    // 컴포넌트 언마운트 또는 의존성 변경 시 하이라이트 제거
    return () => {
      rendition?.annotations.remove(annotation.cfi, annotation.type)
    }
  }, [
    annotation.cfi,
    annotation.color,
    annotation.type,
    rendition?.annotations,
    tab,
  ])

  // 이 컴포넌트는 UI를 렌더링하지 않고 사이드 이펙트만 처리
  return null
}

/**
 * Annotations 컴포넌트 Props 인터페이스
 * @interface AnnotationsProps
 * @property {BookTab} tab - 현재 활성화된 책 탭
 */
interface AnnotationsProps {
  tab: BookTab
}

/**
 * Annotations 컴포넌트 - 모든 주석 관련 요소를 통합 관리
 * 검색 결과, 사용자 주석, 정의된 단어를 모두 표시
 *
 * @param {AnnotationsProps} props - 컴포넌트 속성
 */
export const Annotations: React.FC<AnnotationsProps> = ({ tab }) => {
  // 현재 탭의 book과 section 상태를 가져옴 (반응형)
  const { book, section } = useSnapshot(tab)

  return (
    <>
      {/* 검색 결과 하이라이트 */}
      <FindMatches tab={tab} />

      {/* 사용자 주석 표시
          key를 사용하여 React가 주석이 변경될 때 자동으로 마운트/언마운트하도록 함 */}
      {book.annotations
        // 현재 섹션(페이지)에 해당하는 주석만 필터링하여 표시
        // 이는 페이지 전환 시 주석이 깜빡이는 현상을 방지함
        .filter((a) => a.spine.index === section?.index)
        .map((annotation) => (
          <Annotation key={annotation.id} tab={tab} annotation={annotation} />
        ))}

      {/* 정의된 단어 하이라이트 */}
      {book.definitions.map((definition) => (
        <Definition key={definition} tab={tab} definition={definition} />
      ))}
    </>
  )
}
