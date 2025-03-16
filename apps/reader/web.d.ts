/**
 * @author 조현지
 * @description File Handling API를 위한 TypeScript 타입 정의 파일
 * @date 2025-03-16
 */

// https://github.com/christianliebel/paint/blob/850a57cd3cc6f6532791abb6d20d9228ceffb74f/types/static.d.ts#L66
// Type declarations for File Handling API
// File Handling API에 대한 타입 선언

interface LaunchParams {
  files: FileSystemFileHandle[] // 앱 실행 시 사용자가 선택한 파일들의 핸들 배열
  // FileSystemFileHandle은 웹에서 파일에 접근할 수 있는 핸들 객체를 의미한다.
}
interface LaunchQueue {
  setConsumer(consumer: (launchParams: LaunchParams) => any): void
  // 애플리케이션 시작 시 파일 처리를 담당할 콜백 함수를 등록하는 메서드
  // consumer 함수는 LaunchParams를 인자로 받아 파일 처리 작업을 수행한다.
}

interface Window {
  launchQueue: LaunchQueue
  // Window 객체에 launchQueue 속성을 추가하여 전역적으로 접근 가능하게 한다.
}
