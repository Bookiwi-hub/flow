# Data URL이란?

작성자: 채종민

**Data URL**은 데이터를 URL 형태로 표현한 문자열로, 파일이나 리소스를 Base64 인코딩이나 일반 텍스트로 포함한다. 이는 HTTP 요청을 통해 외부 파일을 가져오는 대신, 데이터를 인라인으로 제공하여 웹 페이지나 애플리케이션에서 직접 사용할 수 있게 한다. Data URL은 주로 이미지, 텍스트, 작은 바이너리 데이터를 처리하는 데 사용한다.

## Data URL의 구조

Data URL은 다음과 같은 형식을 따른다:

```
data:[<MIME 타입>][;charset=<인코딩>][;base64],<데이터>
```

- **`data:`**: Data URL임을 나타내는 스키마(프로토콜).
- **`[<MIME 타입>]`**: 데이터의 MIME 타입으로, 데이터 형식을 지정 (예: `image/png`, `text/plain`).
- **`[;charset=<인코딩>]`**: 텍스트 데이터의 문자 인코딩을 지정 (예: `charset=utf-8`), 생략 가능.
- **`[;base64]`**: 데이터가 Base64로 인코딩되었음을 나타냄, 생략 시 일반 텍스트로 간주.
- **`,<데이터>`**: 실제 데이터로, Base64 인코딩된 바이너리 또는 URL 인코딩된 텍스트.

### 예시

1. **텍스트 Data URL**:

   ```
   data:text/plain;charset=utf-8,Hello%20World
   ```

   - MIME 타입: `text/plain`
   - 인코딩: `utf-8`
   - 데이터: `Hello World` (`%20`은 공백의 URL 인코딩).

2. **이미지 Data URL**:
   ```
   data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
   ```
   - MIME 타입: `image/png`
   - 인코딩: `base64`
   - 데이터: Base64로 인코딩된 PNG 이미지 바이너리.

---

## Data URL의 주요 활용 사례

Data URL은 다양한 웹 개발 시나리오에서 사용:

1. **이미지 인라인 포함**:

   - HTML에서 `<img>` 태그의 `src` 속성에 Data URL을 사용하여 별도 요청 없이 이미지를 표시.
   - 예: `<img src="data:image/png;base64,...">`.

2. **CSS 배경 이미지**:

   - CSS 속성(`background-image`)에 Data URL을 활용해 배경 이미지를 인라인으로 설정.
   - 예: `background-image: url(data:image/jpeg;base64,...);`.

3. **작은 데이터 전송**:

   - 작은 아이콘이나 텍스트 데이터를 페이지에 직접 포함하여 네트워크 요청 감소.
   - 예: `<a href="data:text/plain,Hello">Download</a>`.

4. **클라이언트 측 데이터 처리**:
   - 파일 업로드 후 미리보기나 데이터베이스 저장을 위해 Data URL로 변환.

---

## Data URL의 생성과 사용: `toDataUrl` 예시

사용자가 제공한 `toDataUrl` 함수는 URL에서 가져온 데이터를 Data URL로 변환하는 실용적인 예시.

### `toDataUrl` 함수 코드

```typescript
/**
 * URL을 Data URL로 변환하는 함수
 * @param {string} url - 변환할 URL (예: "https://example.com/image.png")
 * @returns {Promise<string>} Data URL 문자열 (예: "data:image/png;base64,...")
 */
async function toDataUrl(url: string) {
  const res = await fetch(url) // URL에서 데이터 가져오기 (네트워크 요청 수행)
  const buffer = await res.blob() // 응답을 Blob으로 변환 (바이너리 데이터로 저장)
  return readBlob((r) => r.readAsDataURL(buffer)) // Blob을 Data URL로 변환하여 반환
}
```

### 동작 방식

1. **`fetch(url)`**: 네트워크에서 리소스(예: 이미지)를 가져온다.
2. **`res.blob()`**: 응답을 `Blob` 객체로 변환하여 바이너리 데이터를 준비한다.
3. **`readBlob` 호출**: `FileReader`의 `readAsDataURL` 메서드를 사용해 `Blob`을 Base64 인코딩된 Data URL로 변환한다.
4. **결과 반환**: 변환된 Data URL을 `Promise`로 반환한다.

### 활용 예시

#### 1. 이미지 미리보기

```typescript
async function showImagePreview(url: string) {
  const dataUrl = await toDataUrl(url)
  const img = document.createElement('img')
  img.src = dataUrl // Data URL을 이미지 소스로 설정
  document.body.appendChild(img) // 화면에 이미지 표시
}

showImagePreview('https://example.com/sample.png')
```

- **결과**: `"data:image/png;base64,..."`
- **설명**: 네트워크에서 가져온 이미지를 Data URL로 변환해 별도 요청 없이 표시.

#### 2. CSS 배경 이미지

```typescript
async function setBackgroundImage(url: string) {
  const dataUrl = await toDataUrl(url)
  document.body.style.backgroundImage = `url(${dataUrl})` // Data URL을 배경 이미지로 설정
}

setBackgroundImage('https://example.com/background.jpg')
```

- **결과**: `"data:image/jpeg;base64,..."`
- **설명**: CSS에서 Data URL을 사용해 배경 이미지를 인라인으로 설정.

#### 3. 데이터베이스 저장 (사용자의 `file.ts`에서)

```typescript
const url = await epub.coverUrl()
const cover = url && (await toDataUrl(url))
db?.covers.add({ id, cover })
```

- **결과**: `"data:image/jpeg;base64,..."`
- **설명**: EPUB 파일의 커버 이미지를 Data URL로 변환하여 IndexedDB에 저장.

---

## Data URL의 장점과 단점

### 장점

- **네트워크 요청 감소**: 외부 파일을 가져오는 HTTP 요청을 줄여 페이지 로딩 속도를 개선 (작은 데이터에 한함).
- **인라인 사용**: HTML, CSS, JavaScript에서 바로 사용 가능.
- **오프라인 지원**: Data URL로 데이터를 저장하면 네트워크 없이도 리소스 사용 가능.

### 단점

- **데이터 크기 증가**: Base64 인코딩은 원본 데이터보다 약 33% 더 큰 용량을 차지.
- **메모리 사용**: 큰 파일을 Data URL로 변환하면 브라우저 메모리 부담 증가.
- **가독성 저하**: 긴 문자열로 인해 코드나 HTML이 복잡해질 수 있음.

#### 비교: Data URL vs 외부 URL

| **항목**        | **Data URL**                 | **외부 URL**                    |
| --------------- | ---------------------------- | ------------------------------- |
| **요청 수**     | 없음 (인라인)                | 있음 (HTTP 요청)                |
| **데이터 크기** | Base64로 약 33% 증가         | 원본 크기 유지                  |
| **적합성**      | 작은 데이터 (아이콘, 썸네일) | 큰 파일 (동영상, 대용량 이미지) |

---

## Data URL의 성능 및 모범 사례

1. **크기 제한 고려**:

   - Data URL은 작은 데이터(예: 10KB 미만)에 적합. 큰 파일은 성능 저하를 유발.
   - 예: 1MB 이미지 → 약 1.33MB Data URL.

2. **캐싱 활용**:

   - 자주 사용하는 Data URL은 로컬 저장소나 IndexedDB에 저장해 재사용.
   - 사용자의 `file.ts`처럼 커버 이미지를 DB에 저장.

3. **압축 사용**:

   - Base64 인코딩 전 데이터를 압축하여 크기를 줄임 (예: PNG 최적화).

4. **브라우저 호환성**:
   - 모든 현대 브라우저에서 지원되지만, 최대 길이 제한(예: IE는 32KB)이 있으므로 주의.

---

## Data URL과 관련된 기술

- **`FileReader`**: `readAsDataURL` 메서드로 Blob을 Data URL로 변환 (사용자의 `readBlob`에서 활용).
- **`fetch`와 `Blob`**: 네트워크 데이터를 Blob으로 가져와 Data URL로 변환 (사용자의 `toDataUrl`에서 활용).
- **Base64 인코딩**: 바이너리 데이터를 텍스트로 변환하는 핵심 기술.
