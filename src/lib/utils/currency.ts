/**
 * 게임 내 환율: ₩1,000 = $1
 * 모든 API 가격은 KRW 단위로 저장됨.
 * 해외 기업은 이름에 한글이 없으면 USD로 표시.
 */

const EXCHANGE_RATE = 1000;

export type CurrencyCode = 'KRW' | 'USD';

export function isKoreanName(name: string): boolean {
	return /[\uAC00-\uD7AF]/.test(name);
}

export function getCurrency(companyName: string): CurrencyCode {
	return isKoreanName(companyName) ? 'KRW' : 'USD';
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

/** 가격 포맷 (원시 KRW 값 입력) */
export function formatPrice(raw: number, currency: CurrencyCode): string {
	const sym = getCurrencySymbol(currency);
	if (currency === 'USD') {
		const usd = raw / EXCHANGE_RATE;
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
	if (Math.abs(val) >= 1_000_000_000) return sym + (val / 1_000_000_000).toFixed(1) + 'B';
	if (Math.abs(val) >= 1_000_000) return sym + (val / 1_000_000).toFixed(1) + 'M';
	if (Math.abs(val) >= 1_000) return sym + (val / 1_000).toFixed(1) + 'K';
	return sym + val.toLocaleString();
}
