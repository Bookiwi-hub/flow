// 객체의 키를 타입 안전하게 추출하는 함수
/**
 * 객체의 키를 배열로 반환하며, 타입을 유지합니다.
 * @param {T} o - 키를 추출할 객체
 * @return {(keyof T)[]} - 객체의 키 배열
 * @example
 * const obj = { name: 'John', age: 30 };
 * keys(obj); // ['name', 'age']
 */
export function keys<T extends object>(o: T) {
  return Object.keys(o) as (keyof T)[] // Object.keys는 string[]을 반환하지만, as (keyof T)[]로 타입 단언하여 keyof T 타입으로 변환
}

// 숫자를 특정 범위로 제한하는 함수
/**
 * 주어진 숫자를 min과 max 사이로 제한합니다.
 * @param {number} value - 제한할 숫자
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @return {number} - min과 max 사이의 값
 * @example
 * clamp(5, 1, 10); // 5
 * clamp(0, 1, 10); // 1
 * clamp(15, 1, 10); // 10
 */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max) // value가 min보다 작으면 min, max보다 크면 max, 그 사이면 value 반환
}

// 배열의 마지막 요소를 반환하는 함수
/**
 * 배열의 마지막 요소를 반환합니다.
 * @param {T[]} array - 요소를 추출할 배열
 * @return {T} - 배열의 마지막 요소
 * @example
 * const arr = [1, 2, 3];
 * last(arr); // 3
 */
export function last<T>(array: T[]) {
  return array[array.length - 1] // 배열의 길이에서 1을 뺀 인덱스로 마지막 요소에 접근
}

// 배열을 그룹화하는 함수
/**
 * 배열의 요소를 특정 키를 기준으로 그룹화합니다.
 * @param {T[]} array - 그룹화할 배열
 * @param {(item: T) => string | number} getKey - 각 요소에서 그룹 키를 추출하는 함수
 * @return {Record<string, T[]>} - 키를 기준으로 그룹화된 객체
 * @example
 * const arr = [{ id: 1, category: 'A' }, { id: 2, category: 'B' }, { id: 3, category: 'A' }];
 * group(arr, (item) => item.category); // { A: [{ id: 1, category: 'A' }, { id: 3, category: 'A' }], B: [{ id: 2, category: 'B' }] }
 */
export function group<T>(array: T[], getKey: (item: T) => string | number) {
  const o: Record<string, T[]> = {} // 빈 객체를 초기화하여 그룹을 저장할 준비
  array.forEach((item) => {
    // 배열의 각 요소에 대해 반복
    const key = getKey(item) // getKey 함수로 키를 추출
    o[key] = [...(o[key] ?? []), item] // 해당 키가 없으면 빈 배열을 만들고, 기존 배열에 item을 추가
  })
  return o // 그룹화된 객체 반환
}

// 텍스트를 클립보드에 복사하는 함수
/**
 * 주어진 텍스트를 클립보드에 복사합니다.
 * @param {string} text - 복사할 텍스트
 * @return {Promise<void>} - 복사 작업의 Promise
 */
export function copy(text: string) {
  return navigator.clipboard.writeText(text) // 브라우저의 클립보드 API를 사용하여 텍스트를 클립보드에 씀
}
