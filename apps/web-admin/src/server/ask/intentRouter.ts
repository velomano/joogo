// 토큰 최적화된 의도 라우터
// 목표: 600 토큰 이하로 의도 파악

interface IntentSlots {
  intent: string;
  slots: Record<string, any>;
  needLLM: boolean;
  confidence: number;
}

interface QueryContext {
  question: string;
  tenantId: string;
  history?: string;
}

// 키워드 기반 빠른 의도 파악 (LLM 호출 없음)
export async function route(query: QueryContext): Promise<IntentSlots> {
  const { question, tenantId } = query;
  const lower = question.toLowerCase();
  
  // 1. 높은 신뢰도 패턴 (LLM 불필요)
  if (/(top|상위|베스트|best)/i.test(question) && /\d+/.test(question)) {
    const limitMatch = question.match(/(\d+)/);
    const limit = limitMatch ? Math.min(20, parseInt(limitMatch[1])) : 5;
    const days = extractDays(question);
    
    return {
      intent: 'top_sku_days',
      slots: { limit, days, tenantId },
      needLLM: false,
      confidence: 0.95
    };
  }
  
  if (/(monthly|월별|trend|추세|월간)/i.test(question)) {
    return {
      intent: 'monthly_summary',
      slots: { tenantId },
      needLLM: false,
      confidence: 0.9
    };
  }
  
  if (/(annual|연간|올해|year|총매출|total)/i.test(question)) {
    return {
      intent: 'annual_total',
      slots: { tenantId },
      needLLM: false,
      confidence: 0.9
    };
  }
  
  if (/(mom|전월|전월대비|증감|변화|비교)/i.test(question)) {
    return {
      intent: 'mom_change',
      slots: { tenantId },
      needLLM: false,
      confidence: 0.85
    };
  }
  
  if (/(sku|SKU|추세|trend|패턴)/i.test(question)) {
    const skuMatch = question.match(/(?:SKU-|sku-)?(\d+)/i);
    if (skuMatch) {
      return {
        intent: 'sku_trend',
        slots: { sku: `SKU-${skuMatch[1]}`, tenantId },
        needLLM: false,
        confidence: 0.8
      };
    }
  }
  
  if (/(inventory|재고|수량|개수|몇개|얼마나|보유량|현재수량)/i.test(question)) {
    return {
      intent: 'inventory_analysis',
      slots: { tenantId },
      needLLM: false,
      confidence: 0.85
    };
  }
  
  if (/(product|상품|제품|검색|찾기)/i.test(question)) {
    const keywords = extractProductKeywords(question);
    return {
      intent: 'product_analysis',
      slots: { keywords, tenantId },
      needLLM: false,
      confidence: 0.8
    };
  }
  
  // 2. 요약/개요 질문 (LLM 필요할 수 있음)
  if (/(summary|요약|개요|overview|현황|전체|대시보드)/i.test(question)) {
    return {
      intent: 'summary_overview',
      slots: { tenantId },
      needLLM: true, // 복잡한 요약은 LLM 필요
      confidence: 0.7
    };
  }
  
  // 3. 기본값: 상품 분석
  return {
    intent: 'product_analysis',
    slots: { tenantId },
    needLLM: false,
    confidence: 0.6
  };
}

// 헬퍼 함수들
function extractDays(question: string): number {
  if (/day|일|daily/i.test(question)) return 1;
  if (/week|주|weekly/i.test(question)) return 7;
  if (/month|월|monthly/i.test(question)) return 30;
  if (/quarter|분기|quarterly/i.test(question)) return 90;
  if (/year|년|annual|연간/i.test(question)) return 365;
  
  // 숫자 + 일 패턴
  const match = question.match(/(\d+)\s*(일|day|days)/i);
  if (match) return Math.min(365, Math.max(1, parseInt(match[1])));
  
  return 30; // 기본값
}

function extractProductKeywords(question: string): string[] {
  const keywords = [];
  const productTerms = ['티셔츠', '후드', '모자', '상의', '하의', '신발', '가방', '액세서리'];
  
  for (const term of productTerms) {
    if (question.toLowerCase().includes(term.toLowerCase())) {
      keywords.push(term);
    }
  }
  
  // 색상 키워드
  const colors = ['red', 'blue', 'black', 'white', '빨강', '파랑', '검정', '흰색'];
  for (const color of colors) {
    if (question.toLowerCase().includes(color.toLowerCase())) {
      keywords.push(color);
    }
  }
  
  return keywords;
}


