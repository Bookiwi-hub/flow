/**
 * @author ☯채종민
 * @description eBook 리더 애플리케이션을 위한 어노테이션(하이라이트) 유형, 색상, 데이터 구조를 정의합니다.
 * @date 2025-03-17
 */

/**
 * eBook 텍스트에 적용할 수 있는 어노테이션 유형을 정의한다.
 * 현재는 'highlight'만 지원하며, 'underline'는 향후 구현을 위해 주석 처리되어 있는 걸로 보임.
 */
export type AnnotationType = keyof typeof typeMap

/**
 * 어노테이션 유형을 스타일 속성과 CSS 클래스로 매핑합니다.
 */
export const typeMap = {
  highlight: {
    style: 'backgroundColor', // 배경 색상을 적용할 CSS 속성
    class: 'rounded', // Tailwind CSS로 둥근 모서리를 추가
  },
  // underline: {
  //   style: 'border-bottom-color',  // 밑줄 색상을 지정하는 CSS 속성
  //   class: 'border-b-2',           // Tailwind CSS로 밑줄 두께 설정
  // },
}

/**
 * 어노테이션에 사용할 수 있는 색상 정의.
 */
export type AnnotationColor = keyof typeof colorMap

/**
 * 어노테이션 색상 매핑 객체.
 * 20% 투명도를 적용
 */
export const colorMap = {
  yellow: 'rgba(217, 119, 6, 0.2)', // 노란색 하이라이트
  red: 'rgba(220, 38, 38, 0.2)', // 빨간색 하이라이트
  green: 'rgba(22, 163, 74, 0.2)', // 초록색 하이라이트
  blue: 'rgba(37, 99, 235, 0.2)', // 파란색 하이라이트
}

/**
 * 어노테이션 객체 타입
 */
export interface Annotation {
  id: string // 어노테이션의 고유 식별자
  bookId: string // 어노테이션이 속한 책의 식별자
  cfi: string // EPUB CFI: epub 파일 좌표
  spine: {
    // 책의 섹션(spine)에 대한 정보
    index: number // 섹션의 인덱스
    title: string // 섹션의 제목
  }
  createAt: number // 어노테이션이 생성된 시간(타임스탬프)
  updatedAt: number // 어노테이션이 마지막으로 수정된 시간(타임스탬프)
  type: AnnotationType // 어노테이션 유형(예: 'highlight')
  color: AnnotationColor // 어노테이션 색상
  notes?: string // 선택적 필드: 어노테이션에 추가된 메모나 코멘트
  text: string // 어노테이션이 적용된 텍스트 내용
}
