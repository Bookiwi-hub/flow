/**
 * @author 한상우
 * @description 전자책 리더의 테마 및 색상 설정을 관리하는 컴포넌트
 */

/**
 *
 * 이 파일은 사용자가 리더의 색상 테마와 배경색을 커스터마이징할 수 있는
 * 인터페이스를 제공합니다. 소스 색상 선택기와 다양한 배경색 옵션을 제공합니다.
 *
 * ■ 주요 컴포넌트:
 * 1. ThemeView - 테마 설정 최상위 컴포넌트
 * 2. Background - 배경색 옵션을 표시하는 컴포넌트
 *
 * ■ 주요 기능:
 * - 소스 색상 선택 (ColorPicker)
 * - 다양한 배경색 옵션 제공
 * - 라이트 모드와 다크 모드 전환
 */

import clsx from 'clsx'
import { ComponentProps } from 'react'

import { range } from '@flow/internal'
import {
  useBackground,
  useColorScheme,
  useSourceColor,
  useTranslation,
} from '@flow/reader/hooks'

import { ColorPicker, Label } from '../Form'
import { PaneViewProps, PaneView, Pane } from '../base'

/**
 * ThemeView 컴포넌트
 *
 * 테마 설정을 관리하는 최상위 컴포넌트입니다.
 * 소스 색상 선택과 배경색 옵션을 제공합니다.
 */
export const ThemeView: React.FC<PaneViewProps> = (props) => {
  // 컬러 스킴(라이트/다크 모드) 관리 훅
  const { setScheme } = useColorScheme()
  // 소스 색상(주 색상) 관리 훅
  const { sourceColor, setSourceColor } = useSourceColor()
  // 배경색 관리 훅
  const [, setBackground] = useBackground()
  const t = useTranslation('theme')

  return (
    <PaneView {...props}>
      <Pane headline={t('title')} className="space-y-3 px-5 pt-2 pb-4">
        <div>
          {/* 소스 색상 선택기 */}
          <ColorPicker
            name={t('source_color')}
            defaultValue={sourceColor}
            onChange={(e) => {
              setSourceColor(e.target.value)
            }}
          />
        </div>
        <div>
          {/* 배경색 선택 섹션 */}
          <Label name={t('background_color')}></Label>
          <div className="flex gap-2">
            {/* 라이트 모드 배경색 옵션들 */}
            {range(7)
              .filter((i) => !(i % 2))
              .map((i) => i - 1)
              .map((i) => (
                <Background
                  key={i}
                  className={i > 0 ? `bg-surface${i}` : 'bg-white'}
                  onClick={() => {
                    setScheme('light') // 라이트 모드로 설정
                    setBackground(i) // 선택한 배경색 인덱스로 설정
                  }}
                />
              ))}
            {/* 다크 모드 배경색 옵션 */}
            <Background
              className="bg-black"
              onClick={() => {
                setScheme('dark') // 다크 모드로 설정
              }}
            />
          </div>
        </div>
      </Pane>
    </PaneView>
  )
}

interface BackgroundProps extends ComponentProps<'div'> {}

/**
 * Background 컴포넌트
 *
 * 배경색 옵션을 시각적으로 표시하는 컴포넌트입니다.
 * 클릭 가능한 색상 견본(swatch)을 제공합니다.
 */
const Background: React.FC<BackgroundProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('border-outline-variant light h-6 w-6 border', className)}
      {...props}
    ></div>
  )
}
