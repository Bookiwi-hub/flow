import { Dropbox } from 'dropbox'

export const dbx = new Dropbox({
  // Dropbox API에 접근할 수 있는 인스턴스 생성
  clientId: process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID, // Dropbox 앱 클라이언트 ID
  clientSecret: process.env.DROPBOX_CLIENT_SECRET, // Dropbox 앱 클라이언트 시크릿
})

// Dropbox API와 연결할 수 있는 클라이언트를 설정하는 역할을 함.
// 환경 변수를 사용해 보안성을 유지하면서 설정 값을 관리.
// dbx 객체를 다른 곳에서 가져와서 OAuth 인증, 파일 업로드, 다운로드 등의 기능을 수행 가능.
