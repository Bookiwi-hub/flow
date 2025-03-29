/**
 * @author ☯채종민
 * @description Settings 컴포넌트는 애플리케이션의 설정 페이지를 구현합니다.
 * 언어 설정, 색상 테마, 동기화 설정, 캐시 관리 등의 기능을 제공합니다.
 * 사용자가 애플리케이션의 기본 동작과 외관을 커스터마이즈할 수 있게 합니다.
 */

import { useEventListener } from '@literal-ui/hooks'
import Dexie from 'dexie'
import { useRouter } from 'next/router'
import { parseCookies, destroyCookie } from 'nookies'

import {
  ColorScheme,
  useColorScheme,
  useForceRender,
  useTranslation,
} from '@flow/reader/hooks'
import { dbx, mapToToken, OAUTH_SUCCESS_MESSAGE } from '@flow/reader/sync'

import { Button } from '../Button'
import { Select } from '../Form'
import { Page } from '../Page'

/**
 * Settings 컴포넌트 - 애플리케이션의 설정 페이지
 * 언어, 색상 테마, 동기화, 캐시 등의 설정을 관리합니다.
 */
export const Settings: React.FC = () => {
  // 색상 테마 상태 관리
  const { scheme, setScheme } = useColorScheme()
  // 라우팅 관련 훅
  const { asPath, push, locale } = useRouter()
  // 다국어 지원을 위한 번역 훅
  const t = useTranslation('settings')

  return (
    <Page headline={t('title')}>
      <div className="space-y-6">
        {/* 언어 설정 섹션 */}
        <Item title={t('language')}>
          <Select
            value={locale}
            onChange={(e) => {
              push(asPath, undefined, { locale: e.target.value })
            }}
          >
            <option value="en-US">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="ja-JP">日本語</option>
          </Select>
        </Item>

        {/* 색상 테마 설정 섹션 */}
        <Item title={t('color_scheme')}>
          <Select
            value={scheme}
            onChange={(e) => {
              setScheme(e.target.value as ColorScheme)
            }}
          >
            <option value="system">{t('color_scheme.system')}</option>
            <option value="light">{t('color_scheme.light')}</option>
            <option value="dark">{t('color_scheme.dark')}</option>
          </Select>
        </Item>

        {/* 동기화 설정 섹션 */}
        <Synchronization />

        {/* 캐시 관리 섹션 */}
        <Item title={t('cache')}>
          <Button
            variant="secondary"
            onClick={() => {
              // 로컬 스토리지 초기화
              window.localStorage.clear()
              // IndexedDB 데이터베이스 삭제
              Dexie.getDatabaseNames().then((names) => {
                names.forEach((n) => Dexie.delete(n))
              })
            }}
          >
            {t('cache.clear')}
          </Button>
        </Item>
      </div>
    </Page>
  )
}

/**
 * Synchronization 컴포넌트 - Dropbox 동기화 설정을 관리
 * OAuth 인증을 통한 Dropbox 연동 및 해제 기능을 제공합니다.
 */
const Synchronization: React.FC = () => {
  // 쿠키에서 Dropbox 리프레시 토큰 확인
  const cookies = parseCookies()
  const refreshToken = cookies[mapToToken['dropbox']]
  // 강제 리렌더링을 위한 훅
  const render = useForceRender()
  // 동기화 관련 번역
  const t = useTranslation('settings.synchronization')

  /**
   * OAuth 인증 성공 메시지 수신 시 처리
   * 새 창에서 인증이 완료되면 메인 창을 새로고침하여 상태 업데이트
   */
  useEventListener('message', (e) => {
    if (e.data === OAUTH_SUCCESS_MESSAGE) {
      window.location.reload()
    }
  })

  return (
    <Item title={t('title')}>
      {/* 동기화 서비스 선택 */}
      <Select>
        <option value="dropbox">Dropbox</option>
      </Select>

      {/* 인증 상태에 따른 버튼 표시 */}
      <div className="mt-2">
        {refreshToken ? (
          // 인증된 상태: 인증 해제 버튼
          <Button
            variant="secondary"
            onClick={() => {
              destroyCookie(null, mapToToken['dropbox'])
              render()
            }}
          >
            {t('unauthorize')}
          </Button>
        ) : (
          // 미인증 상태: 인증 버튼
          <Button
            onClick={() => {
              // Dropbox OAuth 인증 URL 생성 및 새 창에서 열기
              const redirectUri =
                window.location.origin + '/api/callback/dropbox'
              dbx.auth
                .getAuthenticationUrl(
                  redirectUri,
                  JSON.stringify({ redirectUri }),
                  'code',
                  'offline',
                )
                .then((url) => {
                  window.open(url as string, '_blank')
                })
            }}
          >
            {t('authorize')}
          </Button>
        )}
      </div>
    </Item>
  )
}

/**
 * Item 컴포넌트 - 설정 항목을 표시하는 컨테이너
 * @interface PartProps
 * @property {string} title - 설정 항목의 제목
 * @property {React.ReactNode} children - 설정 항목의 내용
 */
interface PartProps {
  title: string
}
const Item: React.FC<PartProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="typescale-title-small text-on-surface-variant">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

// 컴포넌트 디버깅을 위한 displayName 설정
Settings.displayName = 'settings'
