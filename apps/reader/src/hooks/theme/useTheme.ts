import { Theme } from '@material/material-color-utilities'
import { atom, useRecoilValue, useSetRecoilState } from 'recoil'

/**
 * 테마 상태를 저장하는 Recoil atom
 *
 * atom: Recoil의 기본 상태 단위, 애플리케이션 전역에서 공유 가능
 *
 * Theme 타입은 @material/material-color-utilities 라이브러리에서 가져옴
 * 이 라이브러리는 Material Design 3의 색상 생성 알고리즘을 제공
 */
const themeState = atom<Theme | undefined>({
  key: 'theme', // Recoil 내부에서 이 atom을 식별하는 고유 키
  default: undefined, // 초기값은 undefined
})

/**
 * 현재 테마 객체를 가져오는 훅
 *
 * useRecoilValue: Recoil atom의 값만 읽는 훅
 * 이 훅을 사용하는 컴포넌트는 테마 상태가 변경될 때만 리렌더링됨
 * Material Design 3 테마 객체 또는 undefined
 */
export function useTheme() {
  return useRecoilValue(themeState)
}

/**
 * 테마를 설정하는 함수를 가져오는 훅
 *
 * useSetRecoilState: Recoil atom의 값을 변경하는 함수만 가져오는 훅
 * 이 훅을 사용하는 컴포넌트는 테마를 변경할 수 있지만,
 * 테마 상태가 변경되어도 리렌더링되지 않음 (성능 최적화bb)
 *
 * 읽기/쓰기 함수를 분리하여 사용중임(우리도 활용하면 좋을 듯)
 * 1. 관심사 분리 (변경 로직과 표시 로직 분리)
 * 2. 불필요한 리렌더링 방지
 *
 * @returns {function} 테마 상태를 설정하는 함수
 */
export function useSetTheme() {
  return useSetRecoilState(themeState)
}
