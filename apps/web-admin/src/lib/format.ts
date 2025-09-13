/**
 * 숫자 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 변환
 * @param value - 포맷팅할 숫자
 * @param decimals - 소수점 자릿수 (기본값: 0)
 * @returns 포맷팅된 문자열
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 금액을 원화로 포맷팅
 * @param value - 금액 (원)
 * @param decimals - 소수점 자릿수 (기본값: 0)
 * @returns ₩포맷팅된 문자열
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return `₩${formatNumber(value, decimals)}`;
}

/**
 * 백분율을 포맷팅
 * @param value - 백분율 값 (0-100)
 * @param decimals - 소수점 자릿수 (기본값: 1)
 * @returns %포맷팅된 문자열
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * 큰 숫자를 단위별로 포맷팅 (K, M, B)
 * @param value - 숫자
 * @param decimals - 소수점 자릿수 (기본값: 1)
 * @returns 단위가 포함된 문자열
 */
export function formatCompact(value: number, decimals: number = 1): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  } else {
    return formatNumber(value, decimals);
  }
}

/**
 * 금액을 단위별로 포맷팅
 * @param value - 금액 (원)
 * @param decimals - 소수점 자릿수 (기본값: 1)
 * @returns ₩포맷팅된 문자열
 */
export function formatCurrencyCompact(value: number, decimals: number = 1): string {
  return `₩${formatCompact(value, decimals)}`;
}
