// 환경별 로깅 제어
const isDevelopment = process.env.NODE_ENV === 'development';
const isDebug = process.env.DEBUG === 'true';

export const logger = {
  // 개발 환경에서만 출력
  dev: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },

  // 디버그 모드에서만 출력
  debug: (...args: any[]) => {
    if (isDebug) {
      console.log('[DEBUG]', ...args);
    }
  },

  // 항상 출력 (에러, 중요 정보)
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },

  // 경고 (항상 출력)
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  // 에러 (항상 출력)
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  // 성능 측정
  time: (label: string) => {
    if (isDevelopment) {
      console.time(`[PERF] ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(`[PERF] ${label}`);
    }
  }
};

// 기존 console.log를 대체하는 함수
export const log = isDevelopment ? console.log : () => {};
export const logDebug = isDebug ? console.log : () => {};
