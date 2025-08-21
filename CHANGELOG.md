# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.1.0] - 2025-08-21
### Added
- Supabase 기반 멀티테넌트 구조 초안 설계 및 RLS 정책 적용
- Expo 기반 스캔앱 제작 (바코드 스캔, 오프라인 저장, 성능 개선)
- Next.js 웹 어드민 기본 화면 생성 (로그인, 대시보드, 데이터 업로드)
- Retool 관리자 페이지 기초 연결
- GitHub 레포 `velomano/joogo` 초기화 및 문서 체계 생성 (README, CHANGELOG, ARCHITECTURE, ROADMAP, RUNBOOK)
- Windows ↔ Mac 개발 환경 분리, npm 기반 실행 스크립트 정리

### Changed
- 패키지 매니저 pnpm → npm 전환
- README 실행/설치 가이드 최신화
- .env 구성 단순화 (최소 세트 vs 확장 세트 구분)

### Fixed
- 중복된 pnpm 설정 제거
- 환경변수 누락 시 서버 미기동 문제 해결
- 웹 어드민/백엔드 헬스체크 개선

## [Unreleased]
- 헬스 상태 집계 API (`/api/health`) 추가 예정
- CSV 업로드 → 스캔앱 연동 테스트 보강
- GitHub Issues 기반 태스크 관리 전환
