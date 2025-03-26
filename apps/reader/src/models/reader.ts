import { debounce } from '@github/mini-throttle/decorators'
import { IS_SERVER } from '@literal-ui/hooks'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { proxy, ref, snapshot, subscribe, useSnapshot } from 'valtio'

import type { Rendition, Location, Book } from '@flow/epubjs'
import Navigation, { NavItem } from '@flow/epubjs/types/navigation'
import Section from '@flow/epubjs/types/section'

import { AnnotationColor, AnnotationType } from '../annotation'
import { BookRecord, db } from '../db'
import { fileToEpub } from '../file'
import { defaultStyle } from '../styles'

import { dfs, find, INode } from './tree'
// 배열에서 삭제된 항목의 인덱스를 업데이트함
// 삭제된 인덱스가 범위를 벗어나면 마지막 인덱스 반환
function updateIndex(array: any[], deletedItemIndex: number) {
  const last = array.length - 1
  return deletedItemIndex > last ? last : deletedItemIndex
}

// 섹션의 href와 네비게이션 항목의 href를 비교
// EPUB 전자책의 링크가 상대 경로일 수 있으므로 두 가지 방식으로 비교
export function compareHref(
  sectionHref: string | undefined,
  navitemHref: string | undefined,
) {
  if (sectionHref && navitemHref) {
    const [target] = navitemHref.split('#')

    return (
      sectionHref.endsWith(target!) ||
      // fix for relative nav path `../Text/example.html`
      target?.endsWith(sectionHref)
    )
  }
}
// 대소문자 구분 없이 정의를 비교
function compareDefinition(d1: string, d2: string) {
  return d1.toLowerCase() === d2.toLowerCase()
}

// 네비게이션 항목 인터페이스 정의 (EPUB의 목차 항목)
export interface INavItem extends NavItem, INode {
  subitems?: INavItem[] // 하위 목차
}

// 검색 결과 매치 인터페이스 정의
export interface IMatch extends INode {
  excerpt: string // 매치된 내용 발췌
  description?: string // 매치 설명
  cfi?: string // CFI
  subitems?: IMatch[] // // 하위 검색 결과
}

// EPUB 섹션 인터페이스
export interface ISection extends Section {
  length: number // 섹션 텍스트 길이
  images: string[] // 섹션 내 이미지 경로 목록
  navitem?: INavItem // 연결된 네비게이션 항목
}

// 사용자 이동위치와 타임스탬프를 저장
interface TimelineItem {
  location: Location // EPUB 내 위치
  timestamp: number // 타임스탬프
}

// 탭 기본 클래스 정의 - BookTab과 PageTab의 부모
class BaseTab {
  constructor(public readonly id: string, public readonly title = id) {}

  // Book의 인스턴스인지
  get isBook(): boolean {
    return this instanceof BookTab
  }

  //  Page의 인스턴스인지
  get isPage(): boolean {
    return this instanceof PageTab
  }
}

// https://github.com/pmndrs/valtio/blob/92f3311f7f1a9fe2a22096cd30f9174b860488ed/src/vanilla.ts#L6
type AsRef = { $$valtioRef: true }

/**
 * BookTab - EPUB 전자책을 표시하는 탭 구현
 * 책의 렌더링, 상태 관리, 검색, 주석, 북마크 기능 제공
 */
export class BookTab extends BaseTab {
  epub?: Book // EPUB 책 객체
  iframe?: Window & AsRef // 책 콘텐츠를 표시하는 iframe
  rendition?: Rendition & { manager?: any } // 책 렌더링 관리자
  nav?: Navigation // 책 네비게이션(목차) 정보
  locationToReturn?: Location // 돌아갈 이전 위치
  section?: ISection // 현재 표시 중인 섹션
  sections?: ISection[] /// 책의 모든 섹션
  results?: IMatch[] // 검색 결과과
  activeResultID?: string // 활성화된 검색 결과
  rendered = false // 렌더링 완료 여부

  // 랜더링된 책의 컨테이너 요소를 반환
  get container() {
    return this?.rendition?.manager?.container as HTMLDivElement | undefined
  }

  // 사용자 탐색 기록과 현재 위치를 관리하는 타임라인
  timeline: TimelineItem[] = []
  // 현재 위치를 반환하는 getter (타임라인의 첫 번째 항목)
  get location() {
    return this.timeline[0]?.location
  }

  /**
   * 특정 위치(target)로 이동하는 메서드
   * @param target 이동할 위치(CFI 또는 href)
   * @param returnable 이전 위치로 돌아갈 수 있는지 여부
   */
  display(target?: string, returnable = true) {
    this.rendition?.display(target) // 위치 이동
    // true면 현재위치를 저장, returnable: 이전위치로 돌아갈 수 있는지
    if (returnable) this.showPrevLocation()
  }
  /**
   * CSS 선택자를 사용하여 특정 요소 위치로 이동하는 메서드
   * @param selector CSS 선택자
   * @param section 대상 섹션
   * @param returnable 이전 위치로 돌아갈 수 있는지 여부
   */
  displayFromSelector(selector: string, section: ISection, returnable = true) {
    try {
      const el = section.document.querySelector(selector)
      if (el) this.display(section.cfiFromElement(el), returnable)
    } catch (err) {
      this.display(section.href, returnable)
    }
  }
  /**
   * 이전 페이지로 이동하는 메서드
   * 페이지 전환 시 화면 깜빡임 방지 로직 포함
   */
  prev() {
    this.rendition?.prev()
    // 내용 깜빡임 방지
    if (this.container?.scrollLeft === 0 && !this.location?.atStart) {
      this.rendered = false
    }
  }
  // 다음 페이지로 이동
  next() {
    this.rendition?.next()
  }

  /**
   * 책 정보를 업데이트하고 데이터베이스에 저장하는 메서드
   * @param changes 변경할 책 정보
   */
  updateBook(changes: Partial<BookRecord>) {
    changes = {
      ...changes,
      updatedAt: Date.now(),
    }
    // valtio가 업데이트를 일괄 처리할 수 있도록 비동기 처리 없이 즉시 상태 업데이트
    this.book = { ...this.book, ...changes }
    db?.books.update(this.book.id, changes)
  }

  annotationRange?: Range // 주석 생성을 위한 텍스트 범위
  /**
   * CFI로부터 주석 범위 설정
   * @param cfi 콘텐츠 조각 식별자
   */
  setAnnotationRange(cfi: string) {
    const range = this.view?.contents.range(cfi)
    if (range) this.annotationRange = ref(range)
  }

  /**
   * 단어 정의를 추가하는 메서드
   * @param def 추가할 단어 정의 배열
   */
  define(def: string[]) {
    this.updateBook({ definitions: [...this.book.definitions, ...def] })
  }

  /**
   * 단어 정의를 삭제하는 메서드
   * @param def 삭제할 단어 정의
   */
  undefine(def: string) {
    this.updateBook({
      definitions: this.book.definitions.filter(
        (d) => !compareDefinition(d, def),
      ),
    })
  }

  /**
   * 단어 정의 존재 여부 확인
   * @param def 확인할 단어 정의
   */
  isDefined(def: string) {
    return this.book.definitions.some((d) => compareDefinition(d, def))
  }

  /**
   * Range 객체로부터 CFI 생성
   * @param range 텍스트 범위
   */
  rangeToCfi(range: Range) {
    return this.view.contents.cfiFromRange(range)
  }

  /**
   * 주석 추가 또는 업데이트
   * @param type 주석 유형
   * @param cfi 주석 위치(CFI)
   * @param color 주석 색상
   * @param text 주석 텍스트
   * @param notes 추가 노트
   */
  putAnnotation(
    type: AnnotationType,
    cfi: string,
    color: AnnotationColor,
    text: string,
    notes?: string,
  ) {
    const spine = this.section
    if (!spine?.navitem) return

    const i = this.book.annotations.findIndex((a) => a.cfi === cfi)
    let annotation = this.book.annotations[i]

    const now = Date.now()
    if (!annotation) {
      // 새 주석 생성
      annotation = {
        id: uuidv4(),
        bookId: this.book.id,
        cfi,
        spine: {
          index: spine.index,
          title: spine.navitem.label,
        },
        createAt: now,
        updatedAt: now,
        type,
        color,
        notes,
        text,
      }

      this.updateBook({
        // DataCloneError: Failed to execute 'put' on 'IDBObjectStore': #<Object> could not be cloned.
        annotations: [...snapshot(this.book.annotations), annotation],
      })
    } else {
      // 기존 주석 업데이트
      annotation = {
        ...this.book.annotations[i]!,
        type,
        updatedAt: now,
        color,
        notes,
        text,
      }
      this.book.annotations.splice(i, 1, annotation)
      this.updateBook({
        annotations: [...snapshot(this.book.annotations)],
      })
    }
  }

  /**
   * 주석 삭제
   * @param cfi 삭제할 주석의 위치(CFI)
   */
  removeAnnotation(cfi: string) {
    return this.updateBook({
      annotations: snapshot(this.book.annotations).filter((a) => a.cfi !== cfi),
    })
  }

  keyword = '' // 검색 키워드

  /**
   * 검색 키워드 설정 및 검색 트리거
   * @param keyword 검색 키워드
   */
  setKeyword(keyword: string) {
    if (this.keyword === keyword) return // 불필요한 업데이트 방지
    this.keyword = keyword
    this.onKeywordChange() // 키워드 변경 시 검색
  }

  /**
   * 키워드 변경 시 검색 실행 (디바운스 처리로 성능 최적화)
   */
  @debounce(1000)
  async onKeywordChange() {
    this.results = await this.search()
  }
  /**
   * 책의 총 텍스트 길이를 반환하는 getter
   */
  get totalLength() {
    return this.sections?.reduce((acc, s) => acc + s.length, 0) ?? 0
  }

  /**
   * 목차 항목 확장/축소 토글
   * @param id 목차 항목 ID
   */
  toggle(id: string) {
    const item = find(this.nav?.toc, id) as INavItem
    if (item) item.expanded = !item.expanded
  }

  /**
   * 검색 결과 항목 확장/축소 토글
   * @param id 검색 결과 항목 ID
   */
  toggleResult(id: string) {
    const item = find(this.results, id)
    if (item) item.expanded = !item.expanded
  }

  /**
   * 이전 위치 저장 (돌아가기 기능용)
   */
  showPrevLocation() {
    this.locationToReturn = this.location
  }

  /**
   * 저장된 이전 위치 삭제
   */
  hidePrevLocation() {
    this.locationToReturn = undefined
  }

  /**
   * 섹션 href로 해당하는 네비게이션 항목 찾기
   * @param sectionHref 섹션 href
   */
  mapSectionToNavItem(sectionHref: string) {
    let navItem: NavItem | undefined
    this.nav?.toc.forEach((item) =>
      dfs(item as NavItem, (i) => {
        // sectionHref와 일치하는 href를 가진 NavItem을 찾는다.
        if (compareHref(sectionHref, i.href)) navItem ??= i
      }),
    )
    return navItem
  }

  /**
   * 현재 섹션의 href를 반환
   */
  get currentHref() {
    return this.location?.start.href
  }

  /**
   * 현재 네비게이션 항목을 반환
   */
  get currentNavItem() {
    return this.section?.navitem
  }

  /**
   * 현재 뷰 객체를 반환
   */
  get view() {
    return this.rendition?.manager?.views._views[0]
  }

  /**
   * 네비게이션 경로(계층 구조)를 반환
   * @param navItem 시작 네비게이션 항목(기본값: 현재 네비게이션 항목)
   */
  getNavPath(navItem = this.currentNavItem) {
    const path: INavItem[] = []

    if (this.nav) {
      while (navItem) {
        path.unshift(navItem)
        const parentId = navItem.parent
        if (!parentId) {
          navItem = undefined
        } else {
          const index = this.nav.tocById[parentId]!
          navItem = this.nav.getByIndex(parentId, index, this.nav.toc)
        }
      }
    }

    return path
  }

  /**
   * 특정 섹션에서 키워드 검색
   * @param keyword 검색 키워드(기본값: 현재 키워드)
   * @param section 검색할 섹션(기본값: 현재 섹션)
   */
  searchInSection(keyword = this.keyword, section = this.section) {
    if (!section) return

    const subitems = section.find(keyword) as unknown as IMatch[]
    if (!subitems.length) return

    const navItem = section.navitem
    if (navItem) {
      const path = this.getNavPath(navItem)
      path.pop()
      return {
        id: navItem.href,
        excerpt: navItem.label,
        description: path.map((i) => i.label).join(' / '), // 상위경로 문자열로 조인
        subitems: subitems.map((i) => ({ ...i, id: i.cfi! })),
        expanded: true, // UI 펼침표기
      }
    }
  }

  /**
   * 전체 책에서 키워드 검색
   * @param keyword 검색 키워드(기본값: 현재 키워드)
   */
  search(keyword = this.keyword) {
    // avoid blocking input
    return new Promise<IMatch[] | undefined>((resolve) => {
      requestIdleCallback(() => {
        // 브라우저가 유휴 상태일 때 실행
        if (!keyword) {
          resolve(undefined)
          return
        }

        const results: IMatch[] = []

        this.sections?.forEach((s) => {
          const result = this.searchInSection(keyword, s) // 특정 섹션에서 키워드를 검색하고, 결과를 NavItem 경로와 함께 구조화.
          if (result) results.push(result)
        })

        resolve(results)
      })
    })
  }

  private _el?: HTMLDivElement // 랜더링 대상 DOM
  onRender?: () => void // 렌더링 완료 후 호출될 콜백

  /**
   * 책 렌더링 초기화 및 시작
   * @param el 렌더링할 DOM 요소
   */
  async render(el: HTMLDivElement) {
    if (el === this._el) return
    this._el = ref(el)

    // 파일 DB에서 책 파일 가져오기
    const file = await db?.files.get(this.book.id)
    if (!file) return

    // EPUB 객체 생성
    this.epub = ref(await fileToEpub(file.file))

    // 네비게이션(목차) 로드
    this.epub.loaded.navigation.then((nav) => {
      this.nav = nav
    })
    console.log(this.epub)

    // 책 구조(spine) 로드
    this.epub.loaded.spine.then((spine: any) => {
      const sections = spine.spineItems as ISection[] // 스파인 항목을 섹션 배열로 변환
      // https://github.com/futurepress/epub.js/issues/887#issuecomment-700736486
      // 모든 섹션 로드
      const promises = sections.map((s) =>
        s.load(this.epub?.load.bind(this.epub)),
      )

      // 모든 섹션 로드 완료 후 처리
      Promise.all(promises).then(() => {
        // 섹션의 텍스트 길이를 계산
        sections.forEach((s) => {
          // 섹션의 텍스트 길이를 계산하고 저장
          s.length = s.document.body.textContent?.length ?? 0
          // 섹션 내 이미지 추출
          s.images = [...s.document.querySelectorAll('img')].map((el) => el.src)
          // 섹션에 해당하는 네비게이션 항목 연결
          this.epub!.loaded.navigation.then(() => {
            s.navitem = this.mapSectionToNavItem(s.href) // 섹션에 해당하는 네비게이션 항목
          })
        })
        // 섹션 배열 저장 (valtio ref로 반응형 처리)
        this.sections = ref(sections)
      })
    })

    // 렌더링 객체 생성 및 초기화
    this.rendition = ref(
      this.epub.renderTo(el, {
        width: '100%',
        height: '100%',
        allowScriptedContent: true,
      }),
    )
    console.log(this.rendition)

    // 마지막 저장 위치 또는 시작 위치로 이동
    this.rendition.display(
      this.location?.start.cfi ?? this.book.cfi ?? undefined,
    )

    // 기본 스타일 적용
    this.rendition.themes.default(defaultStyle)

    // 렌더링 후크 등록
    this.rendition.hooks.render.register((view: any) => {
      console.log('hooks.render', view)
      this.onRender?.()
    })
    // 위치 변경 이벤트 핸들러
    this.rendition.on('relocated', (loc: Location) => {
      console.log('relocated', loc)
      this.rendered = true // 렌더링 완료 상태로 플래그 설정
      // 타임라인에 현재 위치 추가
      this.timeline.unshift({
        location: loc,
        timestamp: Date.now(),
      })

      // 읽기 진행률 계산
      if (this.sections) {
        const start = loc.start // 현재 위치의 시작점 정보
        const i = this.sections.findIndex((s) => s.href === start.href)
        // 이전 섹션들의 총 길이
        const previousSectionsLength = this.sections
          .slice(0, i)
          .reduce((acc, s) => acc + s.length, 0)
        // 이전 섹션들의 진행률
        const previousSectionsPercentage =
          previousSectionsLength / this.totalLength
        // 현재 섹션의 전체 진행률 비중
        const currentSectionPercentage =
          this.sections[i]!.length / this.totalLength
        // 현재 섹션 내 진행률
        const displayedPercentage = start.displayed.page / start.displayed.total

        // 전체 진행률 계산
        const percentage =
          previousSectionsPercentage +
          currentSectionPercentage * displayedPercentage

        // 현재 위치와 진행률 저장
        this.updateBook({ cfi: start.cfi, percentage })
      }
    })

    // 렌더링 이벤트 핸들러 등록
    this.rendition.on('attached', (...args: any[]) => {
      console.log('attached', args)
    })
    this.rendition.on('started', (...args: any[]) => {
      console.log('started', args)
    })
    this.rendition.on('displayed', (...args: any[]) => {
      console.log('displayed', args)
    })
    this.rendition.on('rendered', (section: ISection, view: any) => {
      console.log('rendered', [section, view])
      // 현재 섹션과 iframe 저장
      this.section = ref(section)
      this.iframe = ref(view.window as Window)
    })
    this.rendition.on('selected', (...args: any[]) => {
      console.log('selected', args)
    })
    this.rendition.on('removed', (...args: any[]) => {
      console.log('removed', args)
    })
  }

  /**
   * 생성자 - 책 정보로 BookTab 인스턴스 생성
   * @param book 책 정보 객체
   */
  constructor(public book: BookRecord) {
    super(book.id, book.name) // baseTab 초기화: ID와 이름 전달

    // don't subscribe `db.books` in `constructor`, it will
    // 1. update the unproxied instance, which is not reactive
    // 2. update unnecessary state (e.g. percentage) of all tabs with the same book
  }
}

/**
 * PageTab 클래스 - React 컴포넌트를 표시하는 탭 구현
 */
class PageTab extends BaseTab {
  constructor(public readonly Component: React.FC<any>) {
    super(Component.displayName ?? 'untitled')
  }
}

type Tab = BookTab | PageTab // 탭 타입 정의
type TabParam = ConstructorParameters<typeof BookTab | typeof PageTab>[0]

/**
 * Group 클래스 - 탭 그룹 관리
 * 여러 탭을 하나의 그룹으로 관리하는 클래스
 */
export class Group {
  id = uuidv4() // 그룹 고유 ID
  tabs: Tab[] = [] // 탭 배열

  /**
   * 생성자 - 탭 배열과 선택된 탭 인덱스로 그룹 생성
   */
  constructor(
    tabs: Array<Tab | TabParam> = [],
    public selectedIndex = tabs.length - 1,
  ) {
    this.tabs = tabs.map((t) => {
      if (t instanceof BookTab || t instanceof PageTab) return t
      const isPage = typeof t === 'function'
      return isPage ? new PageTab(t) : new BookTab(t)
    })
  }
  // 현재 선택된 탭을 반환
  get selectedTab() {
    return this.tabs[this.selectedIndex]
  }
  // BookTab 인스턴스만 필터링하여 반환
  get bookTabs() {
    return this.tabs.filter((t) => t instanceof BookTab) as BookTab[]
  }

  /**
   * 탭 제거
   * @param index 제거할 탭 인덱스
   * @returns 제거된 탭
   */
  removeTab(index: number) {
    const tab = this.tabs.splice(index, 1)
    this.selectedIndex = updateIndex(this.tabs, index)
    return tab[0]
  }

  /**
   * 탭 추가
   * @param param 추가할 탭 또는 탭 매개변수
   * @returns 추가된 탭
   */
  addTab(param: TabParam | Tab) {
    const isTab = param instanceof BookTab || param instanceof PageTab
    const isPage = typeof param === 'function'

    const id = isTab ? param.id : isPage ? param.displayName : param.id

    // 이미 존재하는 탭이면 해당 탭 선택
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index > -1) {
      this.selectTab(index)
      return this.tabs[index]
    }

    // 새 탭 생성
    const tab = isTab ? param : isPage ? new PageTab(param) : new BookTab(param)
    // 현재 선택된 탭 다음에 새 탭 삽입
    this.tabs.splice(++this.selectedIndex, 0, tab)
    return tab
  }
  /**
   * 탭 대체
   * @param param 대체할 탭 매개변수
   * @param index 대체할 탭 인덱스(기본값: 현재 선택된 탭)
   */
  replaceTab(param: TabParam, index = this.selectedIndex) {
    this.addTab(param)
    this.removeTab(index)
  }
  /**
   * 탭 선택
   * @param index 선택할 탭 인덱스
   */
  selectTab(index: number) {
    this.selectedIndex = index
  }
}

/**
 * Reader 클래스 - 전체 리더 애플리케이션 관리
 * 여러 그룹과 탭을 관리하는 최상위 클래스
 */
export class Reader {
  groups: Group[] = [] // 그룹 배열
  focusedIndex = -1 // 현재 포커스된 그룹 인덱스

  get focusedGroup() {
    // 현재 포커스된 그룹을 반환
    return this.groups[this.focusedIndex]
  }

  get focusedTab() {
    // 현재 포커스된 탭을 반환
    return this.focusedGroup?.selectedTab
  }
  // 현재 포커스된 BookTab을 반환
  get focusedBookTab() {
    return this.focusedTab instanceof BookTab ? this.focusedTab : undefined
  }

  /**
   * 탭 추가
   * @param param 추가할 탭 또는 탭 매개변수
   * @param groupIdx 추가할 그룹 인덱스(기본값: 현재 포커스된 그룹)
   * @returns 추가된 탭
   */
  addTab(param: TabParam | Tab, groupIdx = this.focusedIndex) {
    let group = this.groups[groupIdx]
    if (group) {
      this.focusedIndex = groupIdx
    } else {
      // 지정된 그룹이 없으면 새 그룹 생성
      group = this.addGroup([])
    }
    return group.addTab(param)
  }

  /**
   * 탭 제거
   * @param index 제거할 탭 인덱스
   * @param groupIdx 제거할 그룹 인덱스(기본값: 현재 포커스된 그룹)
   * @returns 제거된 탭
   */
  removeTab(index: number, groupIdx = this.focusedIndex) {
    const group = this.groups[groupIdx]
    // 그룹의 마지막 탭이면 그룹 자체를 제거
    if (group?.tabs.length === 1) {
      this.removeGroup(groupIdx)
      return group.tabs[0]
    }
    return group?.removeTab(index)
  }
  /**
   * 탭 대체
   * @param param 대체할 탭 매개변수
   * @param index 대체할 탭 인덱스(기본값: 현재 포커스된 탭)
   * @param groupIdx 대체할 그룹 인덱스(기본값: 현재 포커스된 인덱스)
   */
  replaceTab(
    param: TabParam,
    index = this.focusedIndex,
    groupIdx = this.focusedIndex,
  ) {
    const group = this.groups[groupIdx]
    group?.replaceTab(param, index)
  }

  /**
   * 탭 제거
   * @param index 제거할 탭 인덱스
   */
  removeGroup(index: number) {
    this.groups.splice(index, 1)
    this.focusedIndex = updateIndex(this.groups, index)
  }

  /**
   * 그룹 추가
   * @param tabs 그룹에 속한 탭들
   * @param index // 그룹 인덱스(기본값: 현재포커스된 인덱스 + 1)
   * @returns
   */
  addGroup(tabs: Array<Tab | TabParam>, index = this.focusedIndex + 1) {
    const group = proxy(new Group(tabs))
    this.groups.splice(index, 0, group)
    this.focusedIndex = index
    return group
  }

  /**
   * 그룹 선택
   * @param index 포커스할 인덱스
   */
  selectGroup(index: number) {
    this.focusedIndex = index
  }

  // 그룹 정리
  clear() {
    this.groups = []
    this.focusedIndex = -1
  }

  // EPUB 크기 변경 시 새 크기에 맞게 조정
  resize() {
    // 모든 그룹
    this.groups.forEach(({ bookTabs }) => {
      // 모든 탭
      bookTabs.forEach(({ rendition }) => {
        try {
          rendition?.resize()
        } catch (error) {
          console.error(error)
        }
      })
    })
  }
}

export const reader = proxy(new Reader()) // valtio가 주시하도록 설정

// 객체 값이 바뀔 때마다 콘솔
subscribe(reader, () => {
  console.log(snapshot(reader))
})

// 상태 복사
export function useReaderSnapshot() {
  return useSnapshot(reader)
}
// 전역 스코프에 타입 선언을 확장
declare global {
  interface Window {
    reader: Reader // window.reader 사용 시 타입 오류 없이 사용
  }
}
// 브라우저에서 전역객체 프로퍼티에 Reader 추가
if (!IS_SERVER) {
  window.reader = reader
}
