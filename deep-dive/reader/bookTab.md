# 탑다운 방향 플로우 차트(TD)

```mermaid
flowchart TD
    BookTab["BookTab 클래스"] --> |"1. 초기화"| Book["Book 객체\n(epub.js)"]
    Book --> |"로드"| SpineData["Spine 데이터\n(문서 논리적 순서)"]
    Book --> |"로드"| NavData["Navigation 데이터\n(목차)"]

    BookTab --> |"2. 렌더링"| Rendition["Rendition 객체\n(epub.js)"]
    Rendition --> |"표시"| Container["Container\n(DOM 요소)"]

    BookTab --> |"3. 위치 추적"| Timeline["Timeline\n(사용자 탐색 기록)"]
    Timeline --> |"저장"| Location["Location 객체\n(현재 위치)"]
    Location --> |"업데이트"| BookRecord["BookRecord\n(진행률, CFI 등)"]

    BookTab --> |"4. 검색"| SearchModule["검색 기능\n(키워드 검색)"]
    SearchModule --> |"결과"| Results["IMatch[]\n(검색 결과)"]

    BookTab --> |"5. 탐색"| Navigation["탐색 기능"]
    Navigation --> |"이동"| Display["display(target)\n(특정 위치로 이동)"]
    Navigation --> |"이전"| Prev["prev()\n(이전 페이지)"]
    Navigation --> |"다음"| Next["next()\n(다음 페이지)"]

    BookTab --> |"6. 주석"| Annotation["주석 기능"]
    Annotation --> |"추가"| PutAnnotation["putAnnotation()\n(주석 추가/수정)"]
    Annotation --> |"제거"| RemoveAnnotation["removeAnnotation()\n(주석 제거)"]

    BookTab --> |"7. 정의"| Definition["정의 기능"]
    Definition --> |"추가"| Define["define()\n(정의 추가)"]
    Definition --> |"제거"| Undefine["undefine()\n(정의 제거)"]

    %% 이벤트 처리
    Rendition --> |"이벤트"| Events["이벤트 처리"]
    Events --> |"relocated"| RelocatedEvent["위치 변경 이벤트\n(위치, 진행률 업데이트)"]
    Events --> |"rendered"| RenderedEvent["렌더링 완료 이벤트\n(섹션 업데이트)"]

    %% 주요 속성 및 참조
    BookTab --> |"참조"| Section["ISection\n(현재 섹션)"]
    BookTab --> |"참조"| View["View 객체\n(현재 뷰)"]
    BookTab --> |"참조"| NavItem["INavItem\n(현재 탐색 항목)"]
```

# put-annotation

```mermaid
flowchart TD
    A[putAnnotation 호출] --> B{navitem 존재?}
    B -->|No| C[중단]
    B -->|Yes| D[cfi로 검색]
    D --> E{주석 있음?}
    E -->|No| F[새 주석 생성]
    E -->|Yes| G[기존 주석 가져오기]
    F --> H[annotations에 추가]
    G --> I[주석 업데이트]
    I --> J[annotations 갱신]
    H --> K[updateBook 호출]
    J --> K
    K --> L[종료]
    C --> L
```

# 탐색

````mermaid
flowchart TD
    A[사용자 요청] --> B{요청 유형}
    B -->|display| C[display 호출]
    B -->|prev| D[prev 호출]
    B -->|next| E[next 호출]

    C --> F[rendition.display]
    D --> G[rendition.prev]
    E --> H[rendition.next]

    F --> I[위치 업데이트]
    G --> J[위치 업데이트]
    H --> K[위치 업데이트]

    I --> L[timeline에 추가]
    J --> L
    K --> L

    L --> M[BookRecord 업데이트]
    M --> N[종료]
    ```
````

# 랜더

````mermaid
flowchart TD
    A[render 호출] --> B[EPUB 파일 로드]
    B --> C[Book 객체 생성]
    C --> D[Navigation 로드]
    C --> E[Spine 로드]
    E --> F[섹션 로드 및 처리]
    F --> G[rendition 생성 및 초기화]
    G --> H[마지막 위치로 이동]
    H --> I[스타일 적용]
    I --> J[이벤트 핸들러 등록]
    J --> K[렌더링 완료]
    K --> L[종료]
    ```
````
