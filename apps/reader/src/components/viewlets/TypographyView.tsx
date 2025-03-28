/**
 * @author 한상우
 * @description 전자책 텍스트 및 레이아웃의 타이포그래피 설정을 관리하는 컴포넌트
 */

/**
 *
 * 이 파일은 사용자가 책의 폰트, 크기, 여백 등 텍스트 표시와 관련된
 * 다양한 설정을 조정할 수 있는 인터페이스를 제공합니다.
 * 책별(Book) 설정과 전체(Global) 설정을 별도로 관리합니다.
 *
 * ■ 주요 컴포넌트:
 * 1. TypographyView - 최상위 타이포그래피 설정 컴포넌트
 * 2. NumberField - 숫자 입력 필드 컴포넌트
 *
 * ■ 주요 기능:
 * - 책별/전체 설정 모드 전환
 * - 페이지 뷰 설정 (단일/이중 페이지)
 * - 폰트 패밀리 선택
 * - 폰트 크기, 굵기, 줄 간격, 줌 레벨 조정
 */

import clsx from 'clsx'
import { useCallback, useRef, useState } from 'react'
import { MdAdd, MdRemove } from 'react-icons/md'

import { RenditionSpread } from '@flow/epubjs/types/rendition'
import { useTranslation } from '@flow/reader/hooks'
import { reader, useReaderSnapshot } from '@flow/reader/models'
import {
  defaultSettings,
  TypographyConfiguration,
  useSettings,
} from '@flow/reader/state'
import { keys } from '@flow/reader/utils'

import { Select, TextField, TextFieldProps } from '../Form'
import { PaneViewProps, PaneView, Pane } from '../base'

/**
 * 타이포그래피 설정 범위를 정의하는 열거형
 * - Book: 현재 책에만 적용되는 설정
 * - Global: 모든 책에 적용되는 전역 설정
 */
enum TypographyScope {
  Book,
  Global,
}

// 사용 가능한 폰트 목록
const typefaces = ['default', 'sans-serif', 'serif']

/**
 * TypographyView 컴포넌트
 *
 * 타이포그래피 설정을 관리하는 최상위 컴포넌트입니다.
 * 책별 설정과 전역 설정을 전환할 수 있는 탭과
 * 다양한 타이포그래피 옵션을 조정할 수 있는 컨트롤을 제공합니다.
 */
export const TypographyView: React.FC<PaneViewProps> = (props) => {
  const { focusedBookTab } = useReaderSnapshot() // 현재 포커스된 책 탭 정보
  const [settings, setSettings] = useSettings() // 전역 설정 상태 관리 훅
  const [scope, setScope] = useState(TypographyScope.Book) // 현재 설정 범위 (기본값: 책별)
  const t = useTranslation('typography') // 다국어 지원을 위한 번역 함수

  /**
   * 현재 선택된 범위(책별/전역)에 따라 적절한 설정 값을 가져옵니다.
   * Book 범위일 경우 현재 책의 설정을, Global 범위일 경우 전역 설정을 사용합니다.
   * 책 설정이 없을 경우 기본 설정(defaultSettings)을, 반환합니다.
   */
  const { fontFamily, fontSize, fontWeight, lineHeight, zoom, spread } =
    scope === TypographyScope.Book
      ? focusedBookTab?.book.configuration?.typography ?? defaultSettings
      : settings

  /**
   * 타이포그래피 설정을 업데이트하는 함수
   *
   * 현재 선택된 범위(책별/전역)에 따라 적절한 설정 객체를 업데이트합니다.
   * useCallback으로 메모이제이션하여 불필요한 재생성을 방지합니다.
   *
   * @param k - 업데이트할 설정 키 (타입 안전성을 위해 제네릭 사용)
   * @param v - 새 설정 값
   */
  const setTypography = useCallback(
    <K extends keyof TypographyConfiguration>(
      k: K,
      v: TypographyConfiguration[K],
    ) => {
      if (scope === TypographyScope.Book) {
        // 책별 설정 업데이트 - reader 모델을 통해 현재 책의 설정 갱신
        reader.focusedBookTab?.updateBook({
          configuration: {
            ...reader.focusedBookTab.book.configuration,
            typography: {
              ...reader.focusedBookTab.book.configuration?.typography,
              [k]: v, // 동적 키를 사용한 설정 업데이트
            },
          },
        })
      } else {
        // 전역 설정 업데이트 - 함수형 업데이트로 이전 상태 기반 갱신
        setSettings((prev) => ({
          ...prev,
          [k]: v, // 동적 키를 사용한 설정 업데이트
        }))
      }
    },
    [scope, setSettings], // 의존성: scope나 setSettings가 변경될 때만 함수 재생성
  )

  return (
    <PaneView {...props}>
      {/* 책별/전역 설정 전환 탭 */}
      <div className="typescale-body-medium flex gap-2 px-5 pb-2 !text-[13px]">
        {keys(TypographyScope)
          // 숫자 키 필터링 (enum은 숫자-문자열 쌍으로 생성됨)
          .filter((k) => isNaN(Number(k)))
          .map((scopeName) => (
            <button
              key={scopeName}
              className={clsx(
                TypographyScope[scopeName] === scope
                  ? 'text-on-surface-variant' // 선택된 탭 강조
                  : 'text-outline/60', // 선택되지 않은 탭 흐리게
              )}
              onClick={() => setScope(TypographyScope[scopeName])}
            >
              {t(`scope.${scopeName.toLowerCase()}`)}
            </button>
          ))}
      </div>

      {/* 타이포그래피 설정 패널 */}
      <Pane
        headline={t('title')}
        className="space-y-3 px-5 pt-2 pb-4"
        key={`${scope}${focusedBookTab?.id}`} // 범위나 책이 변경될 때 컴포넌트 리렌더링을 위한 키
      >
        {/* 페이지 뷰 설정 (단일/이중 페이지) */}
        <Select
          name={t('page_view')}
          value={spread ?? RenditionSpread.Auto}
          onChange={(e) => {
            setTypography('spread', e.target.value as RenditionSpread)
          }}
        >
          <option value={RenditionSpread.None}>
            {t('page_view.single_page')}
          </option>
          <option value={RenditionSpread.Auto}>
            {t('page_view.double_page')}
          </option>
        </Select>

        {/* 폰트 패밀리 선택 */}
        <Select
          name={t('font_family')}
          value={fontFamily}
          onChange={(e) => {
            setTypography('fontFamily', e.target.value)
          }}
        >
          {typefaces.map((t) => (
            <option key={t} value={t} style={{ fontFamily: t }}>
              {t}
            </option>
          ))}
        </Select>

        {/* 폰트 크기 설정 */}
        <NumberField
          name={t('font_size')}
          min={14}
          max={28}
          defaultValue={fontSize && parseInt(fontSize)}
          onChange={(v) => {
            setTypography('fontSize', v ? v + 'px' : undefined)
          }}
        />

        {/* 폰트 굵기 설정 */}
        <NumberField
          name={t('font_weight')}
          min={100}
          max={900}
          step={100}
          defaultValue={fontWeight}
          onChange={(v) => {
            setTypography('fontWeight', v || undefined)
          }}
        />

        {/* 줄 간격 설정 */}
        <NumberField
          name={t('line_height')}
          min={1}
          step={0.1}
          defaultValue={lineHeight}
          onChange={(v) => {
            setTypography('lineHeight', v || undefined)
          }}
        />

        {/* 줌 레벨 설정 */}
        <NumberField
          name={t('zoom')}
          min={1}
          step={0.1}
          defaultValue={zoom}
          onChange={(v) => {
            setTypography('zoom', v || undefined)
          }}
        />
      </Pane>
    </PaneView>
  )
}

interface NumberFieldProps extends Omit<TextFieldProps<'input'>, 'onChange'> {
  onChange: (v?: number) => void
}

/**
 * NumberField 컴포넌트
 *
 * 숫자 입력과 증가/감소 버튼을 제공하는 입력 필드 컴포넌트입니다.
 * 사용자는 직접 값을 입력하거나 버튼을 클릭하여 값을 조정할 수 있습니다.
 *
 * ■ ref 사용:
 * - useRef를 사용하여 입력 필드에 대한 참조(ref)를 생성합니다.
 * - 이 ref는 DOM 노드에 직접 접근하여 브라우저 내장 기능(stepUp/stepDown)을 활용합니다.
 * - React의 선언적 방식이 아닌 명령형 코드가 필요한 경우에 유용합니다.
 *
 * @param onChange - 값이 변경될 때 호출되는 콜백 함수
 * @param props - TextField 컴포넌트에 전달할 기타 속성들
 */
const NumberField: React.FC<NumberFieldProps> = ({ onChange, ...props }) => {
  // input 요소에 대한 참조를 생성합니다.
  const ref = useRef<HTMLInputElement>(null)
  const t = useTranslation('action')

  return (
    <TextField
      as="input"
      type="number"
      placeholder="default"
      actions={[
        {
          title: t('step_down'),
          Icon: MdRemove,
          onClick: () => {
            // DOM 노드의 stepDown 메서드를 직접 호출하여 값 감소
            if (!ref.current) return
            ref.current.stepDown() // input 요소의 내장 메서드로 값을 1단계(또는 step 속성 값) 감소
            onChange(Number(ref.current.value)) // 변경된 값으로 콜백 호출
          },
        },
        {
          title: t('step_up'),
          Icon: MdAdd,
          onClick: () => {
            // DOM 노드의 stepUp 메서드를 직접 호출하여 값 증가
            if (!ref.current) return
            ref.current.stepUp() // input 요소의 내장 메서드로 값을 1단계(또는 step 속성 값) 증가
            onChange(Number(ref.current.value)) // 변경된 값으로 콜백 호출
          },
        },
      ]}
      mRef={ref} // ref를 TextField의 mRef 속성으로 전달 (내부적으로 input에 연결됨)
      // 지연 렌더링: 포커스를 잃었을 때만 값 업데이트 (입력 중 불필요한 렌더링 방지)
      onBlur={(e) => {
        onChange(Number(e.target.value))
      }}
      // 입력 값 초기화 함수
      onClear={() => {
        if (ref.current) ref.current.value = '' // DOM 노드의 value 속성 직접 조작
        onChange(undefined) // undefined 전달하여 기본값으로 초기화
      }}
      {...props} // 나머지 props 전달
    />
  )
}
