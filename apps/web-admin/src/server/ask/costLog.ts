// 비용 로그 시스템
// 목표: 각 단계별 토큰 사용량 추적 및 로깅

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  step: string;
  timestamp: string;
  cost_estimate: number;
}

interface CostLog {
  sessionId: string;
  tenantId: string;
  question: string;
  intent: string;
  steps: TokenUsage[];
  totalCost: number;
  cacheHit: boolean;
}

// 비용 추적기
class CostTracker {
  private logs: Map<string, CostLog> = new Map();
  private sessionCounter = 0;
  
  // 새 세션 시작
  startSession(tenantId: string, question: string): string {
    const sessionId = `session_${Date.now()}_${++this.sessionCounter}`;
    
    this.logs.set(sessionId, {
      sessionId,
      tenantId,
      question,
      intent: '',
      steps: [],
      totalCost: 0,
      cacheHit: false
    });
    
    return sessionId;
  }
  
  // 토큰 사용량 기록
  logTokenUsage(
    sessionId: string, 
    step: string, 
    promptTokens: number, 
    completionTokens: number
  ): void {
    const log = this.logs.get(sessionId);
    if (!log) return;
    
    const totalTokens = promptTokens + completionTokens;
    const costEstimate = this.estimateCost(promptTokens, completionTokens);
    
    const usage: TokenUsage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      step,
      timestamp: new Date().toISOString(),
      cost_estimate: costEstimate
    };
    
    log.steps.push(usage);
    log.totalCost += costEstimate;
  }
  
  // 의도 설정
  setIntent(sessionId: string, intent: string): void {
    const log = this.logs.get(sessionId);
    if (log) {
      log.intent = intent;
    }
  }
  
  // 캐시 히트 표시
  markCacheHit(sessionId: string): void {
    const log = this.logs.get(sessionId);
    if (log) {
      log.cacheHit = true;
    }
  }
  
  // 세션 완료 및 로그 반환
  completeSession(sessionId: string): CostLog | null {
    const log = this.logs.get(sessionId);
    if (!log) return null;
    
    // 로그 정리 (메모리 절약)
    this.logs.delete(sessionId);
    
    return log;
  }
  
  // 비용 추정 (GPT-3.5-turbo 기준)
  private estimateCost(promptTokens: number, completionTokens: number): number {
    const promptCostPer1K = 0.0015; // $0.0015 per 1K tokens
    const completionCostPer1K = 0.002; // $0.002 per 1K tokens
    
    const promptCost = (promptTokens / 1000) * promptCostPer1K;
    const completionCost = (completionTokens / 1000) * completionCostPer1K;
    
    return promptCost + completionCost;
  }
  
  // 통계 정보
  getStats(): {
    totalSessions: number;
    totalTokens: number;
    totalCost: number;
    averageTokensPerSession: number;
    cacheHitRate: number;
  } {
    const sessions = Array.from(this.logs.values());
    const totalSessions = sessions.length;
    const totalTokens = sessions.reduce((sum, s) => 
      sum + s.steps.reduce((stepSum, step) => stepSum + step.total_tokens, 0), 0
    );
    const totalCost = sessions.reduce((sum, s) => sum + s.totalCost, 0);
    const cacheHits = sessions.filter(s => s.cacheHit).length;
    
    return {
      totalSessions,
      totalTokens,
      totalCost,
      averageTokensPerSession: totalSessions > 0 ? totalTokens / totalSessions : 0,
      cacheHitRate: totalSessions > 0 ? cacheHits / totalSessions : 0
    };
  }
}

// 전역 인스턴스
export const costTracker = new CostTracker();

// 편의 함수들
export function startCostTracking(tenantId: string, question: string): string {
  return costTracker.startSession(tenantId, question);
}

export function logTokens(
  sessionId: string, 
  step: string, 
  promptTokens: number, 
  completionTokens: number
): void {
  costTracker.logTokenUsage(sessionId, step, promptTokens, completionTokens);
}

export function setSessionIntent(sessionId: string, intent: string): void {
  costTracker.setIntent(sessionId, intent);
}

export function markSessionCacheHit(sessionId: string): void {
  costTracker.markCacheHit(sessionId);
}

export function completeCostTracking(sessionId: string): CostLog | null {
  return costTracker.completeSession(sessionId);
}

export function getCostStats() {
  return costTracker.getStats();
}

// 토큰 카운터 (대략적)
export function estimateTokenCount(text: string): number {
  // 한국어 + 영어 혼합 기준
  // 공백, 구두점 등을 고려하여 대략적 계산
  const words = text.split(/\s+/).length;
  const chars = text.length;
  
  // 단어 기반 추정 (더 정확)
  if (words > 0) {
    return Math.ceil(words * 1.3); // 평균 1.3 토큰/단어
  }
  
  // 문자 기반 추정 (대안)
  return Math.ceil(chars * 0.4); // 평균 0.4 토큰/문자
}

// 응답 메타데이터 생성
export function createResponseMeta(
  sessionId: string, 
  fromCache: boolean = false
): {
  sessionId: string;
  fromCache: boolean;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
} {
  const meta: any = {
    sessionId,
    fromCache
  };
  
  if (!fromCache) {
    // 실제 토큰 사용량이 있는 경우
    const log = costTracker.logs.get(sessionId);
    if (log && log.steps.length > 0) {
      const lastStep = log.steps[log.steps.length - 1];
      meta.tokens = {
        prompt: lastStep.prompt_tokens,
        completion: lastStep.completion_tokens,
        total: lastStep.total_tokens
      };
      meta.cost = lastStep.cost_estimate;
    }
  }
  
  return meta;
}








