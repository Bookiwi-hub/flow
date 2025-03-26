/**
 * @author 한상우
 * @description 전자책에 포함된 이미지를 섹션별로 표시하는 컴포넌트
 */

/**
 *
 * 이 파일은 전자책에 포함된 모든 이미지를 섹션별로 정리하여 보여주는
 * 인터페이스를 제공합니다. 사용자는 각 섹션을 확장/축소하며 이미지를 탐색할 수 있고,
 * 이미지를 클릭하면 해당 위치로 이동할 수 있습니다.
 *
 * ■ 주요 컴포넌트:
 * 1. ImageView - 최상위 컴포넌트
 * 2. Block - 특정 섹션의 이미지 그룹을 표시
 *
 * ■ 주요 기능:
 * - 책의 모든 이미지를 섹션별로 정리하여 표시
 * - 각 섹션 확장/축소 기능
 * - 이미지 클릭 시 해당 위치로 이동
 */

import { useBoolean } from '@literal-ui/hooks'

import { ISection, reader, useReaderSnapshot } from '@flow/reader/models'

import { Row } from '../Row'
import { PaneView, PaneViewProps } from '../base'

/**
 * ImageView 컴포넌트
 *
 * 전자책의 모든 이미지를 섹션별로 표시하는 최상위 컴포넌트입니다.
 * 성능 최적화를 위해 이미지가 있는 섹션만 필터링하고,
 * 섹션이 과도하게 많은 경우(500개 이상) 렌더링하지 않습니다.
 */
export const ImageView: React.FC<PaneViewProps> = (props) => {
  const { focusedBookTab } = useReaderSnapshot()

  // 이미지가 있는 섹션만 필터링합니다.
  const sections = focusedBookTab?.sections?.filter((s) => s.images.length) as
    | ISection[]
    | undefined

  // 성능 최적화: 섹션이 500개 이상이면 렌더링하지 않습니다.
  if ((sections?.length ?? 0) > 500) return null

  return (
    <PaneView {...props}>
      <div className="scroll">
        {sections?.map((s) => (
          <Block key={s.href} section={s} />
        ))}
      </div>
    </PaneView>
  )
}

interface BlockProps {
  section: ISection
}

/**
 * Block 컴포넌트
 *
 * 하나의 섹션에 포함된 모든 이미지를 표시하는 컴포넌트입니다.
 * 확장/축소 가능한 UI를 제공하여 사용자가 필요한 섹션의 이미지만 볼 수 있게 합니다.
 *
 * @param section - 이미지를 포함하는 책의 섹션 정보
 */
const Block: React.FC<BlockProps> = ({ section }) => {
  const { focusedBookTab } = useReaderSnapshot()
  // 확장/축소 상태를 관리합니다. 기본값은 축소(false)입니다.
  const [expanded, toggle] = useBoolean(false)

  // EPUB 리소스 정보 가져오기
  const resources = focusedBookTab?.epub?.resources
  if (!resources) return null // 리소스가 없으면 렌더링하지 않습니다.

  // 이미지 URL과 에셋 정보 추출
  const blobs = resources.replacementUrls // Blob URL 배열
  const assets = resources.assets // 에셋 정보 배열

  return (
    <div>
      {/* 섹션 제목 행 - 클릭 시 확장/축소 토글 */}
      <Row badge expanded={expanded} toggle={toggle} subitems={section.images}>
        {section.navitem?.label} {/* 섹션의 네비게이션 라벨(제목) 표시 */}
      </Row>

      {/* 확장된 상태일 때만 이미지 목록을 표시합니다 */}
      {expanded && (
        <div>
          {section.images.map((src) => {
            // 이미지 소스 URL에 해당하는 에셋과 Blob URL 찾기
            const i = assets.findIndex((a: any) => src.includes(a.href))
            const asset = assets[i]
            const blob = blobs[i]

            if (!blob) return null // Blob URL이 없으면 렌더링하지 않습니다

            return (
              <img
                className="w-full cursor-pointer px-5 py-2"
                key={i}
                src={blob} // Blob URL을 이미지 소스로 사용
                alt={asset.href}
                onClick={() => {
                  // 이미지 클릭 시 해당 이미지가 있는 위치로 이동합니다
                  reader.focusedBookTab?.displayFromSelector(
                    `img[src*="${asset.href}"]`, // 이미지 선택자
                    section, // 이미지가 있는 섹션
                  )
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
