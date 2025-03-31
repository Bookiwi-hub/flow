# TextSelectionMenu.tsx 심층 분석

이 문서는 TextSelectionMenu.tsx 파일에 구현된 주요 기능과 패턴에 대한 심층적인 분석을 제공합니다. 코드 내에서 사용된 핵심 기술, React 패턴 및 UI 구현 기법에 대해 자세히 설명합니다.

## 1. 핵심 기술 및 라이브러리

TextSelectionMenu.tsx에서 사용된 주요 기술과 라이브러리

- **React Hooks**: useState, useRef, useCallback을 활용한 상태 관리 및 최적화
- **Valtio**: useSnapshot을 통한 상태 구독 - 프록시 기반 상태 관리 라이브러리
- **react-focus-lock**: 접근성 향상을 위한 포커스 관리
- **사용자 정의 Hooks**: useTextSelection, useTypography 등 도메인별 로직 추상화
- **DOM API**: Range, Selection, ClientRect 등을 활용한 텍스트 선택 처리
- **EPUB CFI**: 전자책 위치 참조 표준 활용

## 2. 주요 React 패턴

### a) 컴포넌트 분리와 책임 구분

- **TextSelectionMenu**: 로직과 데이터 처리 담당
- **TextSelectionMenuRenderer**: UI 렌더링과 상태 관리 담당
- 이러한 분리는 관심사 분리와 재사용성 향상에 기여

### b) Refs를 활용한 명령형 DOM 접근

- useRef를 통해 TextField에 접근하여 값을 읽음
- 일반적인 React의 선언적 방식보다 명령형 접근이 필요한 경우에 활용

### c) 제어컴포넌트트 & 비제어 컴포넌트 혼합

- 주석 입력 필드는 비제어 컴포넌트로 구현 (ref로 값 접근)
- 대부분의 다른 UI 상태는 제어컴포넌트 방식으로 관리

### d) 조건부 렌더링

- annotate 상태에 따라 다른 UI 표시 (주석 모드 vs 일반 모드)
- 필요한 경우에만 컴포넌트 렌더링하여 성능 최적화

## 3. 레이아웃 계산 및 위치 지정

TextSelectionMenu의 핵심 기능 중 하나는 선택된 텍스트 근처에 메뉴를 정확히 위치시키는 것입니다.

### a) 위치 계산 로직

- **anchorRect**: 선택된 텍스트의 위치와 크기 정보 (DOMRect)
- **containerRect**: 컨테이너 요소의 위치와 크기 정보
- **viewRect**: 뷰 요소의 위치와 크기 정보

### b) layout 함수

- 메뉴의 최적 위치를 계산하는 utility 함수
- 컨테이너 크기, 메뉴 크기, 위치 정보를 고려하여 계산
- LayoutAnchorMode.ALIGN: 선택 영역에 정렬
- position 매개변수: 선택 방향에 따라 메뉴 위치 결정 (Before/After)

### c) 반응형 크기 계산

- 메뉴가 렌더링된 후 실제 크기를 측정하여 위치 계산에 사용
- ref 콜백을 통해 DOM 요소 크기 측정 후 상태 업데이트

### d) 줄 높이(line-height) 고려

- 정확한 세로 위치 계산을 위해 텍스트 줄 높이 계산
- getComputedStyle을 사용해 실제 계산된 스타일 값 취득
- 값이 'normal'과 같은 키워드인 경우 대체 계산 로직 제공

## 4. 사용자 상호작용 처리

### a) 텍스트 선택 처리

- useTextSelection 훅을 통한 선택 상태 관리
- isForwardSelection: 선택 방향 감지 (시작→끝 vs 끝→시작)
- selection과 annotationRange 두 가지 선택 소스 처리

### b) 상호작용 이벤트 처리

- 클릭 이벤트: 주석 추가, 복사, 검색 등 액션 처리
- 키보드 이벤트: Ctrl+C 단축키 처리
- 포커스 관리: FocusLock으로 접근성 향상

### c) 모바일/데스크톱 환경 차이 처리

- isTouchScreen 확인으로 디바이스 타입에 따른 다른 동작 제공
- scale 함수로 화면 크기에 따른 UI 크기 조정
- useMobile 훅으로 모바일 환경 감지 및 대응

## 5. 주석 기능 구현

### a) 주석 데이터 모델

- **type**: 주석 타입 (highlight, underline 등)
- **color**: 주석 색상 (yellow, green, blue 등)
- **cfi**: 주석 위치 (EPUB CFI 형식)
- **text**: 선택된 텍스트 내용
- **notes**: 사용자 입력 메모 (optional)

### b) 주석 관련 액션

- 생성: putAnnotation 메서드로 새 주석 추가
- 수정: 기존 주석 속성 변경
- 삭제: removeAnnotation 메서드로 주석 제거

### c) 주석 시각화

- typeMap: 주석 타입별 스타일 매핑 (CSS 속성)
- colorMap: 색상별 RGB 값 매핑
- 미리보기 UI로 사용자가 주석 스타일 직관적으로 선택 가능

## 6. 접근성 및 사용자 경험 고려

### a) 키보드 접근성

- tabIndex 설정과 FocusLock으로 키보드 사용자 접근성 향상
- 키보드 단축키(Ctrl+C) 지원

### b) 다국어 지원

- useTranslation 훅으로 UI 텍스트 번역 처리

### c) 사용자 환경 대응

- 모바일/데스크톱 환경에 따른 다른 UI 및 동작 제공
- 밝기/어두운 테마 지원 (CSS 클래스 기반)

### d) 즉각적인 피드백

- 주석 추가/편집 즉시 UI에 반영
- 사용자 액션 후 메뉴 자동 숨김으로 깔끔한 UX 제공

## 7. 성능 최적화 기법

### a) 메모이제이션 및 콜백 최적화

- useCallback으로 view 함수 메모이제이션
- 필요한 경우에만 상태 업데이트하여 불필요한 렌더링 방지

### b) 조건부 초기 렌더링

- 필요한 조건을 만족할 때만 컴포넌트 렌더링 (null 반환)
- 선택 영역, 텍스트 내용 등 유효성 검사

### c) 효율적인 DOM 조작

- 직접 DOM 측정은 필요한 시점에만 수행
- 레이아웃 스레싱(thrashing) 방지를 위한 측정-계산-적용 패턴

## 8. 주요 코드 흐름 정리

1. 사용자가 텍스트 선택 또는 주석 클릭
2. useTextSelection 또는 annotationRange를 통해 선택 감지
3. 선택 영역의 Range 객체 및 위치 정보(DOMRect) 취득
4. 선택 방향 및 디바이스 타입에 따라 메뉴 위치 결정
5. TextSelectionMenuRenderer 컴포넌트 렌더링
6. 메뉴 크기 측정 및 정확한 위치 계산
7. 사용자 상호작용에 따른 액션 처리:
   - 복사, 검색, 정의 추가/제거
   - 주석 모드 전환
   - 주석 타입/색상 선택
   - 주석 추가/수정/삭제
8. 액션 완료 후 메뉴 숨김 처리
