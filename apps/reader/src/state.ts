/**
 * @author ☯채종민
 * @description Recoil로 상태를 정의하고 관리,
 *  주로 설정 데이터와 내비게이션 바의 상태를 관리,
 *  설정 데이터를 로컬 스토리지와 동기화
 * @date 2025-03-21
 *
 * Recoil이란?
 * - Recoil은 React 애플리케이션에서 상태 관리를 위한 라이브러리로, Facebook에서 개발됨.
 * - Redux나 Context API보다 간단하고 직관적인 API를 제공하며, React 훅 스타일을 따름.
 * - 주요 장점: 간단한 API, 비동기 지원, React와의 자연스러운 통합.
 *
 * Recoil의 핵심 개념:
 * 1. Atom: 상태의 기본 단위로, 데이터를 저장하고 컴포넌트에서 구독/업데이트 가능.
 * 2. Selector: Atom에서 파생된 읽기 전용 상태.
 * 3. Hook: useRecoilState, useRecoilValue 등으로 상태를 사용.
 *
 * 이 파일에서의 활용:
 * - navbarState: 내비게이션 바 표시 여부 관리.
 * - settingsState: 설정 데이터 관리 및 로컬 스토리지 동기화.
 * - useSettings: 설정 상태를 컴포넌트에서 쉽게 사용하도록 훅 제공.
 */

// @literal-ui/hooks에서 서버 환경 여부를 확인하는 상수를 가져옴
import { IS_SERVER } from '@literal-ui/hooks'
// Recoil 라이브러리에서 atom, AtomEffect, useRecoilState를 가져옴
import { atom, AtomEffect, useRecoilState } from 'recoil'

// EPUB 렌더링 관련 타입(RenditionSpread)을 가져옴
import { RenditionSpread } from '@flow/epubjs/types/rendition'

/**
 * 로컬 스토리지와 상태를 동기화하는 효과(AtomEffect)를 생성하는 함수
 * AtomEffect란?
 * - atom에 부가적인 동작(효과)을 추가하는 함수로, 상태 초기화나 변경 시 로직 실행.
 * - 역할: 외부 저장소(로컬 스토리지)와 상태 동기화, 상태 변경 감지.
 * - 구성: setSelf(상태 초기 설정), onSet(변경 시).
 *
 * @param {string} key - 로컬 스토리지에 저장할 키
 * @param {T} defaultValue - 상태의 기본값
 * @return {AtomEffect<T>} - Recoil의 AtomEffect 타입 반환
 * @example
 * const settingsState = atom<Settings>({
 * key: 'settings', // 고유 키
 * default: defaultSettings, // 기본값: 빈 객체
 * effects: [localStorageEffect('settings', defaultSettings)], // 로컬 스토리지 효과 적용
})
 * const effect = localStorageEffect('theme', { background: 0 });
 */
function localStorageEffect<T>(key: string, defaultValue: T): AtomEffect<T> {
  return ({ setSelf, onSet }) => {
    // 서버 환경에서는 로컬 스토리지를 사용할 수 없으므로 함수 종료
    if (IS_SERVER) return

    // 로컬 스토리지에서 key에 해당하는 값을 가져옴
    const savedValue = localStorage.getItem(key)
    if (savedValue === null) {
      // 값이 없으면 기본값(defaultValue)을 JSON 문자열로 변환해 저장
      localStorage.setItem(key, JSON.stringify(defaultValue))
    } else {
      // 값이 있으면 JSON 파싱 후 atom에 설정
      setSelf(JSON.parse(savedValue))
    }

    // atom 값이 변경될 때 호출되는 콜백
    onSet((newValue, _, isReset) => {
      // 상태가 리셋되면 로컬 스토리지에서 해당 key 제거
      isReset
        ? localStorage.removeItem(key)
        : // 그렇지 않으면 새 값을 JSON 문자열로 변환해 저장
          localStorage.setItem(key, JSON.stringify(newValue))
    })
  }
}

/**
 * 내비게이션 바의 표시 여부를 관리하는 atom
 * Atom이란?
 * - 상태의 기본 단위로, 고유 키(key)와 기본값(default)을 가짐.
 * - 역할: 데이터를 저장하고, 컴포넌트에서 구독/업데이트 가능.
 *
 * @example
 * const [isVisible, setVisible] = useRecoilState(navbarState);
 * setVisible(true); // 내비게이션 바 표시
 */
export const navbarState = atom<boolean>({
  key: 'navbar', // 고유 키
  default: false, // 기본값: false (내비게이션 바 숨김)
})

// 설정 데이터를 위한 인터페이스 정의
export interface Settings extends TypographyConfiguration {
  theme?: ThemeConfiguration // 선택적 테마 설정
}

// 타이포그래피 설정을 위한 인터페이스
export interface TypographyConfiguration {
  fontSize?: string // 글꼴 크기
  fontWeight?: number // 글꼴 두께
  fontFamily?: string // 글꼴 패밀리
  lineHeight?: number // 줄 높이
  spread?: RenditionSpread // EPUB 렌더링 스프레드
  zoom?: number // 확대/축소 비율
}

// 테마 설정을 위한 인터페이스
interface ThemeConfiguration {
  source?: string // 테마 소스
  background?: number // 배경 설정
}

// 기본 설정 값 (빈 객체)
export const defaultSettings: Settings = {}

/**
 * 설정 상태를 관리하는 atom
 * 이 atom은 설정 데이터를 관리하며, localStorageEffect를 통해 로컬 스토리지와 동기화됨.
 */
const settingsState = atom<Settings>({
  key: 'settings', // 고유 키
  default: defaultSettings, // 기본값: 빈 객체
  effects: [localStorageEffect('settings', defaultSettings)], // 로컬 스토리지 효과 적용
})

/**
 * 설정 상태를 읽고 업데이트하기 위한 커스텀 훅
 * useRecoilState란?
 * - React 훅으로, atom의 상태를 읽고 업데이트 가능.
 * - 역할: 컴포넌트에서 atom의 현재 값과 수정 함수를 반환 (useState와 유사).
 * - 반환값: [value, setValue] 배열.
 *
 * @return {[Settings, (newValue: Settings) => void]} - 설정 상태와 상태를 업데이트하는 setter 함수
 * @example
 * const [settings, setSettings] = useSettings();
 * const [{ theme }, setSettings] = useSettings()
 * setSettings((prev)=>{ ...prev, fontSize: '18px' });
 */
export function useSettings() {
  // settingsState의 상태와 setter를 반환
  return useRecoilState(settingsState)
}
