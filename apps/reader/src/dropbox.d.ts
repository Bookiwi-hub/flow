/**
 * @author ☯채종민
 * @description dripbox.d.ts 파일: Dropbox 라이브러리의 타입 선언을 확장하여 auth 속성을 추가
 * @date 2025-03-20
 */

// ESLint가 '사용되지 않는 변수' 경고를 무시하도록 설정 (타입 선언 파일에서는 변수 사용 없음)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dropbox, DropboxAuth } from 'dropbox'

// 'dropbox' 모듈을 확장하여 새로운 타입 선언 추가
// 참고: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
declare module 'dropbox' {
  // Dropbox 인터페이스에 auth 속성 추가 (타입: DropboxAuth)
  interface Dropbox {
    auth: DropboxAuth
  }
}
