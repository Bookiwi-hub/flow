# TextSelectionMenu 컴포넌트 분석

전자책 리더 애플리케이션에서 `TextSelectionMenu` 컴포넌트는 사용자가 텍스트를 선택했을 때 나타나는 컨텍스트 메뉴를 구현합니다. 이 문서에서는 컴포넌트의 핵심 동작 원리와 특히 복잡한 위치 계산 로직을 상세히 설명합니다.

## 목차

1. [컴포넌트 개요](#1-컴포넌트-개요)
2. [DOM 구조와 View 개념](#2-dom-구조와-view-개념)
3. [좌표 시스템과 변환](#3-좌표-시스템과-변환)
4. [핵심 코드 분석](#4-핵심-코드-분석)
5. [특수한 구현의 이유](#5-특수한-구현의-이유)
6. [일반적인 구현과의 차이점](#6-일반적인-구현과의-차이점)
7. [요약 및 교훈](#7-요약-및-교훈)

## 1. 컴포넌트 개요

`TextSelectionMenu`는 사용자가 텍스트를 선택했을 때 선택 영역 근처에 나타나는 메뉴로, 다음과 같은 기능을 제공합니다:

- 선택한 텍스트 복사
- 책 내 검색
- 주석 추가/편집/삭제
- 정의 추가/제거

컴포넌트는 두 부분으로 나뉩니다:

1. `TextSelectionMenu`: 선택 감지 및 데이터 처리
2. `TextSelectionMenuRenderer`: UI 렌더링 및 상태 관리

## 2. DOM 구조와 View 개념

전자책 리더의 DOM 구조는 여러 계층으로 구성되어 있습니다:

![](https://velog.velcdn.com/images/hansw98/post/125d03f3-c408-4214-98ec-c1f216d66d29/image.svg)

```
브라우저 창 (Window)
└── 앱 컨테이너 (App Container)
    └── 리더 컨테이너 (Reader Container)
        └── rendition의 view 요소 (el)
            └── 텍스트 콘텐츠 (선택 영역)
```

여기서 특히 중요한 것은 **rendition의 view 요소**입니다. 이 요소는 코드에서 다음과 같이 접근합니다:

```javascript
const view = useCallback(() => {
  return rendition?.manager?.views._views[0]
}, [rendition])

const el = view()?.element as HTMLElement
if (!el) return null
```

### view()?.element의 의미

- `rendition`: EPUB 파일을 렌더링하는 핵심 객체
- `manager`: 렌더링 과정을 관리하는 객체
- `views._views[0]`: 현재 표시 중인 뷰(페이지)의 배열에서 첫 번째 항목
- `element`: 실제 DOM 요소를 참조

### 메모이제이션과 의존성 배열

```javascript
const view = useCallback(() => {
  return rendition?.manager?.views._views[0]
}, [rendition])
```

이 코드에는 중요한 최적화가 있습니다:

- `rendition`은 반응형(valtio로 관리됨)이지만 `manager`와 그 하위 속성들은 반응형이 아닙니다.
- `useCallback`과 의존성 배열 `[rendition]`을 사용하여 `rendition`이 변경될 때만 함수를 재생성합니다.
- 이렇게 하면 항상 최신 `rendition` 객체를 참조할 수 있습니다.

## 3. 좌표 시스템과 변환

메뉴의 정확한 위치 계산을 위해서는 여러 좌표계 간의 변환이 필요합니다.

### 절대좌표 vs 상대좌표

- **절대좌표**: 브라우저 창(viewport) 좌상단을 원점(0,0)으로 하는 좌표
- **상대좌표**: 특정 부모 요소의 좌상단을 원점(0,0)으로 하는 좌표

### 좌표 변환의 필요성

텍스트 선택 시 발생하는 좌표 문제

1. 선택 영역의 위치는 view 요소 내부의 상대좌표로 얻어집니다.
2. 메뉴는 상위 컨테이너에 렌더링되어야 합니다.
3. 따라서 view 내부의 상대좌표를 상위 컨테이너 기준의 좌표로 변환해야 합니다.

### 좌표 변환 공식

```
메뉴의 절대좌표 = 선택영역의 상대좌표 + view요소의 절대좌표 - 컨테이너의 절대좌표
```

코드로 표현하면:

```javascript
left: anchorRect.left + viewRect.left - containerRect.left
```

### 좌표 측정 방법

```javascript
// view 요소의 경계 정보
viewRect = el.getBoundingClientRect()
// 부모 컨테이너의 경계 정보
containerRect = el.parentElement!.getBoundingClientRect()
```

`getBoundingClientRect()`는 요소의 크기와 뷰포트 상의 위치 정보(top, left, right, bottom 등)를 반환합니다.

## 4. 핵심 코드 분석

메뉴 위치 계산의 핵심 코드는 다음과 같습니다:

```jsx
style={{
  left: layout(containerRect.width, width, {
    offset: anchorRect.left + viewRect.left - containerRect.left,
    size: anchorRect.width,
    mode: LayoutAnchorMode.ALIGN,
    position,
  }),
  top: layout(containerRect.height, height, {
    offset: anchorRect.top - (lineHeight - anchorRect.height) / 2,
    size: lineHeight,
    position,
  }),
}}
```

각 매개변수의 의미

- **anchorRect**: 선택 영역의 위치와 크기 (DOMRect)
- **viewRect**: view 요소의 위치와 크기
- **containerRect**: 부모 컨테이너의 위치와 크기
- **position**: 메뉴 배치 방향 (선택 방향에 따라 Before/After)
- **lineHeight**: 텍스트 줄 높이 (메뉴가 텍스트와 겹치지 않도록)

### layout 함수

`layout` 함수는 메뉴의 최적 위치를 계산하는 유틸리티 함수로, 다음과 같은 작업을 수행합니다

1. 기본 위치(offset) 계산
2. 컨테이너 경계를 벗어나지 않도록 조정
3. 메뉴 크기를 고려한 위치 최적화

### 선택 방향에 따른 메뉴 위치 결정

```javascript
const forward = isTouchScreen
  ? false
  : selection
  ? isForwardSelection(selection)
  : true
```

- **데스크톱 환경**: 사용자의 선택 방향(시작→끝 또는 끝→시작)에 따라 메뉴 위치 조정
- **터치스크린 환경**: 모바일 브라우저의 텍스트 선택 도우미와 겹치지 않도록 항상 선택 영역 위에 메뉴 표시

## 5. 특수한 구현의 이유

이렇게 복잡한 좌표 계산을 사용하는 이유는 전자책 리더의 특수한 환경 때문입니다

1. **EPUB 렌더링의 특수성**: EPUB 콘텐츠는 일반적으로 iframe이나 특수 컨테이너 내에서 렌더링되어 외부 CSS의 영향을 받지 않습니다.

2. **계층화된 뷰 구조**: 전자책 리더는 여러 페이지나 스프레드를 동시에 보여줄 수 있으며, 각각 자체 스크롤 영역을 가질 수 있습니다.

3. **동적 레이아웃 변경**: 사용자가 글꼴 크기, 여백, 줄 간격 등을 조정할 때마다 페이지 레이아웃이 변경됩니다.

4. **크로스 플랫폼 일관성**: 데스크톱과 모바일 환경에서 일관된 사용자 경험을 제공해야 합니다.

5. **성능 고려**: 텍스트 선택이 발생할 때마다 DOM을 최소한으로 조작하여 성능 저하를 방지해야 합니다.

## 6. 일반적인 구현과의 차이점

일반적인 웹 애플리케이션에서는 더 간단한 방법으로 선택 메뉴를 구현할 수 있습니다

### 일반적인 접근법

```jsx
// CSS 포지셔닝 사용
const SelectionMenu = ({ selection }) => {
  const rect = selection.getRangeAt(0).getBoundingClientRect()

  return (
    <div
      style={{
        position: 'absolute',
        top: `${rect.top - 40}px`,
        left: `${rect.left}px`,
      }}
    >
      메뉴 내용
    </div>
  )
}
```

또는 React Portal과 함께

```jsx
import ReactDOM from 'react-dom'

const Menu = ({ position }) => {
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: position.y, left: position.x }}>
      메뉴 내용
    </div>,
    document.body,
  )
}
```

혹은 Popper.js 같은 라이브러리 사용:

```jsx
import { usePopper } from 'react-popper'

function App() {
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement)

  return (
    <>
      <div ref={setReferenceElement}>선택된 텍스트</div>
      <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        메뉴 내용
      </div>
    </>
  )
}
```

### 왜 더 복잡한 접근법을 사용하는가?

1. **중첩된 iframe**: EPUB 렌더러는 종종 격리된 환경에서 콘텐츠를 표시합니다.
2. **다중 좌표계**: 여러 겹의 좌표계를 처리해야 합니다.
3. **레이아웃 변동성**: 전자책 리더는 레이아웃이 자주 변경됩니다.
4. **정확한 위치 지정**: 다양한 환경에서 일관되게 작동해야 합니다.

## 7. 요약

`TextSelectionMenu` 컴포넌트는 전자책 리더의 특수한 요구사항을 해결하기 위해 복잡한 좌표 계산 로직을 구현했습니다. 핵심 요소를 정리하면:

1. **DOM 구조 이해**: `view()?.element`를 통해 EPUB 콘텐츠가 렌더링되는 DOM 요소에 접근합니다.

2. **좌표 변환**: 여러 좌표계 간의 정확한 변환을 위해 `getBoundingClientRect()`와 상대좌표 계산을 활용합니다.

3. **메모이제이션**: `useCallback`과 의존성 배열을 활용해 성능을 최적화합니다.

4. **환경 대응**: 데스크톱과 모바일 환경의 차이를 고려한 동적 위치 조정을 구현합니다.

이 컴포넌트의 구현은 복잡한 UI 인터랙션, 특히 중첩된 좌표계와 동적 레이아웃이 존재하는 환경에서의 정확한 위치 계산에 대한 좋은 예시를 제공합니다.
