# https://github.com/vercel/turborepo/blob/a2a04ed4eba28602c7cdb36377c75a2f7007e90d/examples/with-docker/apps/web/Dockerfile
# 이 Dockerfile은 Vercel의 turborepo 저장소에서 가져온 걸로 보인다.

# 전체 구조
# Dockerfile은 세 단계로 나뉘어 있습니다:

# 1.builder 단계: 의존성 준비 및 프로젝트를 필요한 부분만 추출.
# 2.installer 단계: 의존성 설치 및 프로젝트 빌드.
# 3. runner 단계: 최종 실행 가능한 경량 이미지 생성.

# 1.빌더 단계 
# 모노레포에서 필요한 파일만 추출하는 단계
# 'node:16-alpine'은 Node.js 16 버전의 경량 Alpine Linux 이미지를 사용
FROM node:16-alpine AS builder

# Alpine Linux가 가벼운 친구라 Node.js가 잘 돌아가기 위해 추가로 libc6-compat을 설치해줘야 한다.
# '--no-cache'는 설치 후 캐시를 남기지 않아 이미지 크기 줄임
RUN apk add --no-cache libc6-compat

# Alpine 패키지 매니저(apk)의 패키지 목록을 최신 상태로 업데이트
RUN apk update

# 컨테이너 내 작업 디렉터리를 '/app'으로 설정
# 이후 명령어는 이 디렉터리에서 실행됨
WORKDIR /app

# Yarn을 사용해 Turborepo CLI를 전역 설치
# Turborepo는 모노레포를 효율적으로 관리하고 빌드하는 도구
RUN yarn global add turbo

# 현재 디렉터리(프로젝트 루트)의 모든 파일을 컨테이너의 '/app'에 복사
# 모노레포 전체를 복사해 필요한 부분을 추출할 준비
COPY . .

# Turborepo의 'prune' 명령으로 '@flow/reader' 앱에 필요한 파일만 추출
# '--scope=@flow/reader'는 '@flow/reader' 패키지만 대상으로 지정
# '--docker'는 Docker 빌드에 최적화된 출력(out/ 디렉터리)을 생성
# 결과물은 'out/' 디렉터리에 저장됨
RUN turbo prune --scope=@flow/reader --docker

# 설치 단계
# 의존성 설치 및 프로젝트 빌드를 위한 단계
# 새로운 경량 'node:alpine' 이미지를 기반으로 시작
FROM node:alpine AS installer

# 'builder' 단계와 동일한 이유로 'libc6-compat' 설치
RUN apk add --no-cache libc6-compat

# 패키지 목록 업데이트
RUN apk update

# 작업 디렉터리를 '/app'으로 설정
WORKDIR /app

# '.gitignore' 파일 복사
# 빌드 중 불필요한 파일을 무시하는 데 사용하기 위해
COPY .gitignore .gitignore

# 빌드에서 생성된 의존성 관련 파일들 복사
COPY --from=builder /app/out/json/ .  
# JSON 의존성 파일 복사
COPY --from=builder /app/out/pnpm-*.yaml .  
# pnpm lock 파일 복사

# Node.js의 'corepack' 활성화
# 'corepack'을 통해 'pnpm' 패키지 매니저 사용 가능
RUN corepack enable

# 'pnpm'을 사용해 의존성 설치
# '--frozen-lockfile'은 락파일에 명시된 버전만 설치하도록 강제해 일관성 유지
RUN pnpm i --frozen-lockfile

# 'builder' 단계에서 추출된 전체 소스 코드 복사
# 'out/full/'에는 '@flow/reader' 앱의 소스 코드와 관련 파일이 포함됨
COPY --from=builder /app/out/full/ .

# Turborepo 설정 파일 복사
# 모노레포 빌드 설정이 포함됨
COPY turbo.json turbo.json

# TypeScript 설정 파일 복사
# 프로젝트 빌드에 필요한 TS 설정 포함
COPY tsconfig.*json .

# 'pnpm'을 사용해 '@flow/reader' 앱 빌드
# '-F reader'는 'reader'라는 필터로 특정 앱만 대상으로 지정
# 'DOCKER=1'은 환경 변수를 설정해 Docker 환경에 맞게 빌드 조정
RUN DOCKER=1 pnpm -F reader build


# 러너 단계: 
# 최종 실행 가능한 경량 이미지를 생성
# 새로운 'node:alpine' 이미지를 기반으로 시작
FROM node:alpine AS runner

# 작업 디렉터리를 '/app'으로 설정
WORKDIR /app

# 보안을 위해 비루트 그룹 'nodejs' 생성
# '--system'은 시스템 그룹으로 생성하는 명령어, '--gid 1001'은 그룹 ID 지정하는 명령어
RUN addgroup --system --gid 1001 nodejs

# 비루트 사용자 'nextjs' 생성
# '--system'은 시스템 사용자, '--uid 1001'은 사용자 ID 지정하는 명령어
RUN adduser --system --uid 1001 nextjs

# 이후 명령을 'nextjs' 사용자로 실행
# 루트 권한을 제거해 보안 강화
USER nextjs

# 'installer' 단계에서 생성된 Next.js 설정 파일 복사
COPY --from=installer /app/apps/reader/next.config.js .

# 'installer' 단계에서 생성된 패키지 메타데이터 복사
COPY --from=installer /app/apps/reader/package.json .

# Next.js의 'standalone' 출력 복사
# '.next/standalone/'는 출력 파일 추적 기능으로 생성된 독립 실행 파일들
# '--chown=nextjs:nodejs'는 파일 소유권을 'nextjs' 사용자와 'nodejs' 그룹으로 설정
COPY --from=installer --chown=nextjs:nodejs /app/apps/reader/.next/standalone ./

# 정적 파일 복사
# '.next/static/'에는 앱의 정적 자산이 포함됨
# 소유권을 'nextjs:nodejs'로 설정
COPY --from=installer --chown=nextjs:nodejs /app/apps/reader/.next/static ./apps/reader/.next/static

# 컨테이너 시작 시 실행할 기본 명령
# 'node'를 사용해 'server.js' 실행, Next.js 애플리케이션 구동
CMD node apps/reader/server.js


# 인상 깊은 점
# ✅ 멀티 스테이지 빌드 사용 → 빌드 단계에서만 필요한 의존성을 분리하여 실행 이미지 크기 최소화
# ✅ TurboRepo의 prune 기능 활용 → @flow/reader 관련 패키지만 남기고 불필요한 패키지 제거
# ✅ 보안 강화 → 비루트 사용자를 설정


