│── 📂 epubjs # epub 라이브러리  
│── 📂 internal # 공통 사용 함수
│── 📂 tailwind # tailwind 라이브러리

### `pnpm-workspace.yaml`

이 파일은 pnpm이 모노레포의 구조를 이해하도록 돕는 설정 파일이다. 프로젝트의 작업 공간을 정의하며, **어떤 폴더가 패키지로 관리될지** 알려준다.

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*' # apps 폴더 안 모든 하위 폴더를 패키지로 인식
  - 'packages/*' # packages 폴더 안 모든 하위 폴더를 패키지로 인식
```

```bash
# 폴더 구조
@flow/monorepo/
📂 apps/
 ├── 📂 reader/       # 📖 전자책 앱 (Flow Ebook App) - 하나의 패키지로 인식
 ├── 📂 website/      # 🌐 Flow 웹사이트 - 하나의 패키지로 인식

📂 packages/           # 재사용 가능한 패키지 모음
 ├── 📂 epubjs/       # 📚 EPUB 파일 라이브러리 - 하나의 패키지로 인식
 ├── 📂 internal/     # 🔧 공통 유틸리티 모듈 - 하나의 패키지로 인식
 ├── 📂 tailwind/     # 🎨 Tailwind CSS 설정 - 하나의 패키지로 인식

📄 pnpm-workspace.yaml  # 🛠️ pnpm 모노레포 설정
```

### pnpm을 사용한 의존성 연결

`reader`가 `internal`이나 `tailwind`를 의존성으로 쓰면, pnpm이 로컬 패키지를 연결한다.

```json
// apps/reader/package.json
{
  "name": "@flow/reader",
  "dependencies": {
    "@flow/internal": "workspace:*",
    "@flow/tailwind": "workspace:*"
  }
}
```

1. pnpm install을 실행하면 pnpm은 packages/internal와 packages/tailwind 폴더를 찾아서 reader에 연결한다.
2. 외부 npm 레지스트리(npmjs.com)에서 @flow/internal을 검색하거나 다운로드하지 않고, 로컬 경로(@flow/packages/internal)를 사용한다.
3. 결과적으로 node_modules/@flow/internal는 실제로는 packages/internal의 링크로 설정된다.

### 장점

보통 npm이나 Yarn을 쓰면 의존성이 node_modules에 별도로 복사되거나 다운로드된다. 하지만 pnpm은 모노레포에서 로컬 패키지를 직접 가리키므로 아래와 같은 장점이 있다.

- 네트워크 요청이 없어서 빠르다.
- 동일한 코드베이스 사용 가능
- 저장소에서 관리되는 최신 버전을 바로 반영된다(예: internal 수정 후 internal를 사용하고 있는 reader와 website에 바로 반영).
- pnpm은 중복된 의존성을 한 번만 저장하고 나머지는 하드 링크(hard link)로 참조한다. 모노레포에서 여러 패키지가 같은 의존성을 쓸 때 디스크 공간 절약된다.
