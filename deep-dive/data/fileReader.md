# FileReader

작성자: 채종민

`FileReader`는 웹 애플리케이션에서 파일 데이터를 읽기 위한 핵심 Web API로, 브라우저에서 제공됩니다. 이 도구는 파일 업로드, 미리보기, 데이터 처리 등 다양한 시나리오에서 활용되며, 클라이언트 측에서 파일 내용을 비동기적으로 읽는 데 특화되어 있습니다.

## FileReader란?

`FileReader`는 HTML5에서 도입된 Web API로, `File` 또는 `Blob` 객체의 내용을 읽을 수 있게 해줍니다. 주로 `<input type="file">`로 업로드된 파일이나 네트워크 요청으로 받은 Blob 데이터를 처리할 때 사용됩니다. IndexedDB나 로컬 저장소와 결합하면 오프라인 데이터 관리에도 유용합니다.

### 주요 특징

- **비동기 처리**: 파일 읽기는 시간이 걸릴 수 있으므로 이벤트 기반으로 비동기적으로 실행됩니다.
- **다양한 출력 형식**: 텍스트, Data URL(Base64), 바이너리 데이터 등으로 변환 가능.
- **브라우저 호환성**: Chrome, Firefox, Safari 등 모든 주요 브라우저에서 지원되며, 모바일 환경에서도 잘 동작합니다.

### 사용 사례

- 이미지 파일을 업로드 후 미리보기로 표시.
- 텍스트 파일의 내용을 읽어 화면에 출력.
- 바이너리 데이터를 처리하여 저장하거나 변환.

## FileReader의 주요 메서드

`FileReader`는 파일을 읽는 방식에 따라 여러 메서드를 제공하며, 읽기 결과는 `reader.result` 속성에 저장됩니다.

| **메서드**             | **설명**                                                        | **결과 형식**          |
| ---------------------- | --------------------------------------------------------------- | ---------------------- |
| `readAsText()`         | 파일을 텍스트로 읽음 (인코딩 지정 가능, 기본값 UTF-8)           | `string`               |
| `readAsDataURL()`      | 파일을 Base64 인코딩된 Data URL로 읽음 (예: 이미지 미리보기)    | `string` (Data URL)    |
| `readAsArrayBuffer()`  | 파일을 바이너리 데이터로 읽음 (예: 파일 업로드 또는 처리)       | `ArrayBuffer`          |
| `readAsBinaryString()` | 파일을 이진 문자열로 읽음 (권장되지 않음, 구형 브라우저 호환용) | `string` (이진 문자열) |

### 메서드 사용 예시

```javascript
const file = new File(['Hello'], 'sample.txt', { type: 'text/plain' })
const reader = new FileReader()

reader.readAsText(file) // "Hello"로 읽힘
reader.onload = () => console.log(reader.result) // "Hello"

reader.readAsDataURL(file) // "data:text/plain;base64,SGVsbG8="로 읽힘
reader.onload = () => console.log(reader.result) // "data:text/plain;base64,SGVsbG8="
```

---

## FileReader의 주요 이벤트

`FileReader`는 비동기 작업을 처리하기 위해 이벤트 기반으로 동작합니다. 주요 이벤트는 다음과 같습니다:

| **이벤트**  | **설명**                         | **사용 시기**                     |
| ----------- | -------------------------------- | --------------------------------- |
| `load`      | 읽기가 성공적으로 완료되었을 때  | 결과(`reader.result`)를 가져올 때 |
| `error`     | 읽기 중 오류가 발생했을 때       | 에러 처리                         |
| `progress`  | 읽기 진행 상황을 보고할 때       | 대용량 파일 진행률 표시           |
| `loadstart` | 읽기가 시작되었을 때             | 작업 시작 알림                    |
| `loadend`   | 읽기가 완료되었을 때 (성공/실패) | 작업 종료 후 정리                 |

### 이벤트 사용 예시

```javascript
const reader = new FileReader()
reader.addEventListener('load', () => console.log('성공:', reader.result))
reader.addEventListener('error', () => console.error('실패:', reader.error))
reader.addEventListener('progress', (event) =>
  console.log(`진행률: ${event.loaded}/${event.total}`),
)
reader.readAsText(new File(['Test'], 'test.txt'))
```

## FileReader 동작 방식

1. **객체 생성**: `new FileReader()`로 인스턴스를 생성합니다.
2. **이벤트 리스너 추가**: `load`, `error` 등의 이벤트를 등록하여 결과를 처리합니다.
3. **읽기 메서드 호출**: `readAsText`, `readAsDataURL` 등을 호출해 읽기를 시작합니다.
4. **결과 처리**: `load` 이벤트 발생 시 `reader.result`에서 데이터를 가져옵니다.

## `readBlob` 함수 예시

사용자가 제공한 `readBlob` 함수는 `FileReader`를 캡슐화하여 Promise 기반으로 Blob 데이터를 읽는 유틸리티 함수입니다. 아래는 함수 코드와 함께 다양한 활용 예시입니다.

### `readBlob` 함수 코드

```typescript
/**
 * Blob 데이터를 읽는 유틸리티 함수
 * @param {(reader: FileReader) => void} fn - FileReader를 사용하는 콜백 함수
 * @returns {Promise<string>} 읽은 데이터 (문자열)
 */
export function readBlob(fn: (reader: FileReader) => void) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result as string))
    fn(reader)
  })
}
```

### 예시 1: 이미지 파일을 Data URL로 변환

```typescript
async function previewImage() {
  const fileInput = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement
  const file = fileInput.files?.[0]
  if (file) {
    const dataUrl = await readBlob((reader) => reader.readAsDataURL(file))
    const img = document.createElement('img')
    img.src = dataUrl // "data:image/png;base64,..."
    document.body.appendChild(img) // 이미지 미리보기 표시
  }
}
fileInput?.addEventListener('change', previewImage)
```

- **설명**: 사용자가 업로드한 이미지 파일을 Data URL로 읽어 화면에 미리보기로 표시합니다.

### 예시 2: 텍스트 파일 읽기

```typescript
async function readTextFile() {
  const textFile = new File(['Hello, World!'], 'sample.txt', {
    type: 'text/plain',
  })
  const text = await readBlob((reader) => reader.readAsText(textFile))
  console.log(text) // "Hello, World!"
}
readTextFile()
```

- **설명**: 텍스트 파일의 내용을 읽어 콘솔에 출력합니다.

### 예시 3: 네트워크에서 가져온 Blob 처리

```typescript
async function fetchAndReadImage(url: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  const dataUrl = await readBlob((reader) => reader.readAsDataURL(blob))
  console.log(dataUrl) // "data:image/jpeg;base64,..."
}
fetchAndReadImage('https://example.com/image.jpg')
```

- **설명**: 네트워크에서 가져온 이미지 Blob을 Data URL로 변환하여 처리합니다.
