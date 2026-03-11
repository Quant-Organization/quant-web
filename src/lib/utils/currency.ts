/**
 * 게임 내 환율: ₩1,000 = $1
 * 모든 API 가격은 KRW 단위로 저장됨.
 * 통화 정보는 서버 financials API의 currency 필드로 결정.
 */

const EXCHANGE_RATE = 1000;

export type CurrencyCode = 'KRW' | 'USD';

/** 서버에서 받은 통화 정보 캐시 (company_id → currency) */
const currencyCache = new Map<string, CurrencyCode>();

export function setCachedCurrency(companyId: string, currency: CurrencyCode) {
	currencyCache.set(companyId, currency);
}

export function getCachedCurrency(companyId: string): CurrencyCode {
	return currencyCache.get(companyId) ?? 'KRW';
}

export function getCurrencySymbol(currency: CurrencyCode): string {
	return currency === 'KRW' ? '₩' : '$';
}

/** API 원시 가격(KRW)을 표시 통화로 변환 */
export function toDisplay(raw: number, currency: CurrencyCode): number {
	return currency === 'USD' ? raw / EXCHANGE_RATE : raw;
}

/** 표시 가격을 API 원시 가격(KRW)으로 역변환 */
export function toRaw(display: number, currency: CurrencyCode): number {
	return currency === 'USD' ? display * EXCHANGE_RATE : display;
}

/** 가격 표시 (축약 없음) - 현재가, 단가 등에 사용 */
export function displayPrice(raw: number, currency: CurrencyCode): string {
	const sym = getCurrencySymbol(currency);
	if (currency === 'USD') {
		const usd = raw / EXCHANGE_RATE;
		return sym + usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
	return sym + Math.round(raw).toLocaleString();
}

/** 큰 숫자 축약 포맷 - 시가총액, 매출 등에 사용 */
export function formatPrice(raw: number, currency: CurrencyCode): string {
	const sym = getCurrencySymbol(currency);
	if (currency === 'USD') {
		const usd = raw / EXCHANGE_RATE;
		if (Math.abs(usd) >= 1_000_000_000_000) return sym + (usd / 1_000_000_000_000).toFixed(2) + 'T';
		if (Math.abs(usd) >= 1_000_000_000) return sym + (usd / 1_000_000_000).toFixed(2) + 'B';
		if (Math.abs(usd) >= 1_000_000) return sym + (usd / 1_000_000).toFixed(2) + 'M';
		if (Math.abs(usd) >= 1_000) return sym + (usd / 1_000).toFixed(2) + 'K';
		return sym + usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
	const n = Math.round(raw);
	if (Math.abs(n) >= 1_000_000_000_000) return sym + (n / 1_000_000_000_000).toFixed(1) + '조';
	if (Math.abs(n) >= 100_000_000) return sym + (n / 100_000_000).toFixed(1) + '억';
	if (Math.abs(n) >= 10_000) return sym + (n / 10_000).toFixed(0) + '만';
	return sym + n.toLocaleString();
}

/** 짧은 가격 포맷 (원시 KRW 값) - M/K 단위 */
export function formatPriceShort(raw: number, currency: CurrencyCode): string {
	const sym = getCurrencySymbol(currency);
	const val = currency === 'USD' ? raw / EXCHANGE_RATE : raw;
	if (Math.abs(val) >= 1_000_000_000_000) return sym + (val / 1_000_000_000_000).toFixed(1) + 'T';
	if (Math.abs(val) >= 1_000_000_000) return sym + (val / 1_000_000_000).toFixed(1) + 'B';
	if (Math.abs(val) >= 1_000_000) return sym + (val / 1_000_000).toFixed(1) + 'M';
	if (Math.abs(val) >= 1_000) return sym + (val / 1_000).toFixed(1) + 'K';
	return sym + val.toLocaleString();
}
