/**
 * @author ☯채종민
 * @description Flow 리더 애플리케이션의 메인 페이지 컴포넌트
 * @date 2025-03-26
 */

import { useBoolean } from '@literal-ui/hooks'
import clsx from 'clsx'
import { useLiveQuery } from 'dexie-react-hooks'
// - `dexie-react-hooks`에서 `useLiveQuery`를 가져와 데이터베이스 쿼리를 실시간으로 반영합니다.
import Head from 'next/head'
// - Next.js의 `Head` 컴포넌트를 가져와 HTML `<head>` 태그를 조작합니다.
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdCheckCircle,
  MdOutlineFileDownload,
  MdOutlineShare,
} from 'react-icons/md'
import { useSet } from 'react-use'
import { usePrevious } from 'react-use'
// - `react-use`에서 `useSet` 훅을 가져와 집합(Set) 상태를 관리합니다.
// - `react-use`에서 `usePrevious` 훅을 가져와 이전 상태를 추적합니다.

import { ReaderGridView, Button, TextField, DropZone } from '../components'
import { BookRecord, CoverRecord, db } from '../db'
import { addFile, fetchBook, handleFiles } from '../file'
import {
  useDisablePinchZooming,
  useLibrary,
  useMobile,
  useRemoteBooks,
  useRemoteFiles,
  useTranslation,
} from '../hooks'
import { reader, useReaderSnapshot } from '../models'
import { lock } from '../styles'
import { dbx, pack, uploadData } from '../sync'
import { copy } from '../utils'

// 표지 이미지가 없는 책을 위한 플레이스홀더 이미지
const placeholder = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="gray" fill-opacity="0" width="1" height="1"/></svg>`

// 원격 소스에서 책을 로드하기 위한 URL 파라미터 키
// - URL 파라미터에서 책 소스를 가져올 때 사용할 키 `'src'`를 상수로 정의합니다.
const SOURCE = 'src'

/**
 * 애플리케이션의 진입점 역할을 하는 메인 페이지 컴포넌트
 * URL에서 책 로딩, 파일 드롭, 라이브러리 표시 등을 처리
 */
export default function Index() {
  // - `useReaderSnapshot` 훅을 사용해 현재 포커스된 탭의 정보를 가져옵니다.
  const { focusedTab } = useReaderSnapshot()

  const router = useRouter()
  // - 현재 URL에서 `SOURCE`('src') 파라미터를 추출해 책 소스를 확인합니다.
  const src = new URL(window.location.href).searchParams.get(SOURCE)
  const [loading, setLoading] = useState(!!src)

  // 모바일 환경에서 더 나은 경험을 위해 핀치 줌 비활성화
  // 리더기에서 핀치 줌이 되면 안되기 때문으로 보인다
  useDisablePinchZooming()

  // - URL 파라미터를 통해 책을 로딩하는 useEffect
  useEffect(() => {
    let src = router.query[SOURCE]
    if (!src) return
    if (!Array.isArray(src)) src = [src]

    Promise.all(
      src.map((s) =>
        fetchBook(s).then((b) => {
          reader.addTab(b)
        }),
      ),
    ).finally(() => setLoading(false))
  }, [router.query])

  // PWA 환경에서 OS의 파일 열기 요청을 처리하는 useEffect.
  useEffect(() => {
    // - 브라우저가 `launchQueue`와 `LaunchParams`를 지원하는지 확인합니다.
    if ('launchQueue' in window && 'LaunchParams' in window) {
      window.launchQueue.setConsumer((params) => {
        console.log('launchQueue', params)
        if (params.files.length) {
          Promise.all(params.files.map((f) => f.getFile()))
            .then((files) => handleFiles(files))
            .then((books) => books.forEach((b) => reader.addTab(b)))
        }
      })
    }
  }, [])

  // 브라우저 라우트 이동시 리더 상태를 초기화하는 useEffect
  useEffect(() => {
    router.beforePopState(({ url }) => {
      if (url === '/') {
        reader.clear()
      }
      return true
    })
  }, [router])
  // 의존성 배열로 `router`를 지정해 라우터 변경 시 효과를 재실행합니다.

  return (
    <>
      <Head>
        {/* https://github.com/microsoft/vscode/blob/36fdf6b697cba431beb6e391b5a8c5f3606975a1/src/vs/code/browser/workbench/workbench.html#L16 */}
        {/* 뷰포트 설정으로 화면 크기를 고정하고 핀치 줌 비활성화 - VSCode와 유사한 방식으로 사용자 경험 향상 */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
        />
        {/* 현재 활성화된 탭의 제목을 페이지 타이틀로 사용, 없으면 'Flow' 표시 */}
        <title>{focusedTab?.title ?? 'Flow'}</title>
      </Head>
      <ReaderGridView />
      {loading || <Library />}
      {/** `loading`이  `false`면 `Library` 컴포넌트를 렌더링합니다.*/}
    </>
  )
}

/**
 * 사용 가능한 모든 책을 표시하는 라이브러리 컴포넌트
 * 책 선택, 클라우드 동기화, 파일 작업 등을 처리
 */
const Library: React.FC = () => {
  // 데이터베이스에서 가져온 로컬 책 목록
  const books = useLibrary()
  // 데이터베이스에서 가져온 책 표지
  const covers = useLiveQuery(() => db?.covers.toArray() ?? [])
  // 번역하는 함수
  const t = useTranslation('home')

  // 클라우드 스토리지에서 가져온 원격 책과 파일
  const { data: remoteBooks, mutate: mutateRemoteBooks } = useRemoteBooks()
  const { data: remoteFiles, mutate: mutateRemoteFiles } = useRemoteFiles()

  // - `usePrevious` 훅으로 이전 원격 책 데이터를 추적합니다.
  const previousRemoteBooks = usePrevious(remoteBooks)
  // - `usePrevious` 훅으로 이전 원격 파일 데이터를 추적합니다.
  const previousRemoteFiles = usePrevious(remoteFiles)

  // 책 선택 상태
  const [select, toggleSelect] = useBoolean(false)
  const [selectedBookIds, { add, has, toggle, reset }] = useSet<string>()

  // 비동기 작업을 위한 로딩 상태
  const [loading, setLoading] = useState<string | undefined>()
  const [readyToSync, setReadyToSync] = useState(false)

  const { groups } = useReaderSnapshot()

  // 로컬 책을 클라우드에 동기화하는 useEffect
  useEffect(() => {
    if (previousRemoteFiles && remoteFiles) {
      db?.books.toArray().then((books) => {
        if (books.length === 0) return

        const newRemoteBooks = remoteFiles.map((f) =>
          // - 원격 파일 목록을 순회하며, 로컬 책 중 이름이 일치하는 책을 찾습니다.
          books.find((b) => b.name === f.name),
        ) as BookRecord[]

        // - 찾은 책들을 클라우드에 업로드합니다.
        uploadData(newRemoteBooks)
        mutateRemoteBooks(newRemoteBooks, { revalidate: false })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutateRemoteBooks, remoteFiles])

  // 원격 책을 로컬 데이터베이스에 로드하는 useEffect
  useEffect(() => {
    // 이전 데이터는 없고 현재 원격 책 데이터가 있는 경우
    if (!previousRemoteBooks && remoteBooks) {
      // 원격 책을 로컬 데이터베이스에 일괄 저장하고, 동기화 준비 상태를 `true`로 설정합니다.
      db?.books.bulkPut(remoteBooks).then(() => setReadyToSync(true))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteBooks])

  // 클라우드 스토리지에서 파일 다운로드하는 useEffect
  useEffect(() => {
    if (!remoteFiles || !readyToSync) return

    db?.books.toArray().then(async (books) => {
      for (const remoteFile of remoteFiles) {
        const book = books.find((b) => b.name === remoteFile.name)
        if (!book) continue

        const file = await db?.files.get(book.id)
        if (file) continue

        setLoading(book.id)
        await dbx
          .filesDownload({ path: `/files/${remoteFile.name}` })
          .then((d) => {
            const blob: Blob = (d.result as any).fileBlob
            return addFile(book.id, new File([blob], book.name))
          })
        setLoading(undefined)
      }
    })
  }, [readyToSync, remoteFiles])

  // 선택 모드를 종료할 때 선택 초기화
  useEffect(() => {
    if (!select) reset()
  }, [reset, select])

  // 활성화된 그룹이 있거나 책이 없으면 라이브러리를 렌더링하지 않음
  if (groups.length) return null
  if (!books) return null

  const selectedBooks = [...selectedBookIds].map(
    (id) => books.find((b) => b.id === id)!,
  )
  const allSelected = selectedBookIds.size === books.length

  return (
    <DropZone
      className="scroll-parent h-full p-4"
      onDrop={(e) => {
        // 앱 내에서 책 드래그 처리
        // 드랍된 데이터에서 책 ID를 가져옵니다.
        const bookId = e.dataTransfer.getData('text/plain')
        const book = books.find((b) => b.id === bookId)
        if (book) reader.addTab(book)

        // 드롭된 파일 처리
        handleFiles(e.dataTransfer.files)
      }}
    >
      <div className="mb-4 space-y-2.5">
        <div>
          {/* URL에서 책을 로드하는 입력 필드 */}
          <TextField
            name={SOURCE}
            placeholder="https://link.to/remote.epub"
            type="url"
            hideLabel
            actions={[
              {
                title: t('share'),
                Icon: MdOutlineShare,
                onClick(el) {
                  if (el?.reportValidity()) {
                    copy(`${window.location.origin}/?${SOURCE}=${el.value}`)
                  }
                },
              },
              {
                title: t('download'),
                Icon: MdOutlineFileDownload,
                onClick(el) {
                  if (el?.reportValidity()) fetchBook(el.value)
                },
              },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-x-2">
            {/* 선택 컨트롤 */}
            {books.length ? (
              <Button variant="secondary" onClick={toggleSelect}>
                {t(select ? 'cancel' : 'select')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={!books}
                onClick={() => {
                  fetchBook(
                    'https://epubtest.org/books/Fundamental-Accessibility-Tests-Basic-Functionality-v1.0.0.epub',
                  )
                }}
              >
                {t('download_sample_book')}
              </Button>
            )}
            {select &&
              (allSelected ? (
                <Button variant="secondary" onClick={reset}>
                  {t('deselect_all')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => books.forEach((b) => add(b.id))}
                >
                  {t('select_all')}
                </Button>
              ))}
          </div>

          <div className="space-x-2">
            {/* 책 작업 (업로드/삭제 또는 가져오기/내보내기) */}
            {select ? (
              <>
                <Button
                  onClick={async () => {
                    toggleSelect()

                    for (const book of selectedBooks) {
                      const remoteFile = remoteFiles?.find(
                        (f) => f.name === book.name,
                      )
                      if (remoteFile) continue

                      const file = await db?.files.get(book.id)
                      if (!file) continue

                      setLoading(book.id)
                      await dbx.filesUpload({
                        path: `/files/${book.name}`,
                        contents: file.file,
                      })
                      setLoading(undefined)

                      mutateRemoteFiles()
                    }
                  }}
                >
                  {t('upload')}
                </Button>
                <Button
                  onClick={async () => {
                    toggleSelect()
                    const bookIds = [...selectedBookIds]

                    db?.books.bulkDelete(bookIds)
                    db?.covers.bulkDelete(bookIds)
                    db?.files.bulkDelete(bookIds)

                    // `filesDeleteBatch` 후에 폴더 데이터가 업데이트되지 않음
                    mutateRemoteFiles(
                      async (data) => {
                        await dbx.filesDeleteBatch({
                          entries: selectedBooks.map((b) => ({
                            path: `/files/${b.name}`,
                          })),
                        })
                        return data?.filter(
                          (f) => !selectedBooks.find((b) => b.name === f.name),
                        )
                      },
                      { revalidate: false },
                    )
                  }}
                >
                  {t('delete')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={!books.length}
                  onClick={pack}
                >
                  {t('export')}
                </Button>
                <Button className="relative">
                  <input
                    type="file"
                    accept="application/epub+zip,application/epub,application/zip"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) handleFiles(files)
                    }}
                  />
                  {t('import')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 책 그리드 표시 */}
      <div className="scroll h-full">
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(calc(80px + 3vw), 1fr))`,
            columnGap: lock(16, 32),
            rowGap: lock(24, 40),
          }}
        >
          {books.map((book) => (
            <Book
              key={book.id}
              book={book}
              covers={covers}
              select={select}
              selected={has(book.id)}
              loading={loading === book.id}
              toggle={toggle}
            />
          ))}
        </ul>
      </div>
    </DropZone>
  )
}

interface BookProps {
  book: BookRecord
  covers?: CoverRecord[]
  select?: boolean
  selected?: boolean
  loading?: boolean
  toggle: (id: string) => void
}

/**
 * 라이브러리에서 개별 책을 표시하는 컴포넌트
 * 책 표지, 읽기 진행 상태, 선택 상태 등을 표시
 */
const Book: React.FC<BookProps> = ({
  book,
  covers,
  select,
  selected,
  loading,
  toggle,
}) => {
  const remoteFiles = useRemoteFiles()

  const router = useRouter()
  const mobile = useMobile()

  // - 책 ID와 일치하는 표지를 찾아 `cover` 값을 추출합니다.
  const cover = covers?.find((c) => c.id === book.id)?.cover
  // - 원격 파일 중 책 이름과 일치하는 파일을 찾습니다.
  const remoteFile = remoteFiles.data?.find((f) => f.name === book.name)

  const Icon = selected ? MdCheckBox : MdCheckBoxOutlineBlank

  return (
    <div className="relative flex flex-col">
      <div
        role="button"
        className="border-inverse-on-surface relative border"
        onClick={async () => {
          if (select) {
            toggle(book.id)
          } else {
            if (mobile) await router.push('/_')
            reader.addTab(book)
          }
        }}
      >
        {/* 로딩 진행 표시기 */}
        <div
          className={clsx(
            'absolute bottom-0 h-1 bg-blue-500',
            loading && 'progress-bit w-[5%]',
          )}
        />
        {/* 읽기 진행률 표시기 */}
        {book.percentage !== undefined && (
          <div className="typescale-body-large absolute right-0 bg-gray-500/60 px-2 text-gray-100">
            {(book.percentage * 100).toFixed()}%
          </div>
        )}
        {/* 책 표지 이미지 */}
        <img
          src={cover ?? placeholder}
          alt="Cover"
          className="mx-auto aspect-[9/12] object-cover"
          draggable={false}
        />
        {/* 선택 체크박스 */}
        {select && (
          <div className="absolute bottom-1 right-1">
            <Icon
              size={24}
              className={clsx(
                '-m-1',
                selected ? 'text-tertiary' : 'text-outline',
              )}
            />
          </div>
        )}
      </div>

      {/* 클라우드 동기화 표시기가 있는 책 제목 */}
      <div
        className="line-clamp-2 text-on-surface-variant typescale-body-small lg:typescale-body-medium mt-2 w-full"
        title={book.name}
      >
        <MdCheckCircle
          className={clsx(
            'mr-1 mb-0.5 inline',
            remoteFile ? 'text-tertiary' : 'text-surface-variant',
          )}
          size={16}
        />
        {book.name}
      </div>
    </div>
  )
}
