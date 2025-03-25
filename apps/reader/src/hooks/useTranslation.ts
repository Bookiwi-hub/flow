/**
 * @author 조현지
 * @description 다국어 지원을 위한 번역 기능을 제공하는 React 훅
 * @date 2025-03-25
 */

import { useRouter } from 'next/router'
import { useCallback } from 'react'

import locales from '../../locales'

/**
 * 현재 선택된 로케일에 따라 번역된 텍스트를 반환하는 훅이다.
 * Next.js의 라우터를 사용하여 현재 활성화된 로케일을 가져오고,
 * 메모이제이션된 번역 함수를 제공한다.
 *
 * 사용자의 언어 설정에 따라 동적으로 텍스트를 변경할 수 있게 해준다.
 *
 * @param scope - 선택적 네임스페이스로, 번역 키의 접두사로 사용된다.
 *                이를 통해 번역 키를 구조화하고 관리할 수 있다.
 *                예: 'common.buttons', 'header', 'footer' 등
 * @returns 키를 입력받아 해당하는 번역 문자열을 반환하는 함수
 *
 * 사용 예시:
 * ```
 * // locales 파일에 { ko: { 'greeting': '안녕하세요' }, en: { 'greeting': 'Hello' } } 가 있을 때
 * const t = useTranslation()
 * console.log(t('greeting')) // 현재 로케일이 'ko'이면 '안녕하세요' 출력
 *
 * // 스코프 사용 예
 * // locales 파일에 { ko: { 'buttons.submit': '제출' } } 가 있을 때
 * const t = useTranslation('buttons')
 * console.log(t('submit')) // '제출' 출력
 * ```
 */
export function useTranslation(scope?: string) {
  // Next.js 라우터에서 현재 활성화된 로케일을 가져온다.
  // 이 로케일은 Next.js 라우팅 설정에 따라 결정된다.
  const { locale } = useRouter()

  // useCallback을 사용하여 번역 함수를 메모이제이션한다.
  // 로케일이나 스코프가 변경될 때만 함수가 재생성된다.
  return useCallback(
    (key: string) => {
      // 주어진 키(필요시 스코프와 결합)를 사용하여 locales 객체에서 번역된 문자열을 찾는다.
      // @ts-ignore - TypeScript가 동적 속성 접근을 체크할 수 없어 무시 처리한다.
      return locales[locale][scope ? `${scope}.${key}` : key] as string
    },
    [locale, scope],
  )
}
