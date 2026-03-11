import { fetchFastAPI } from './config';

export interface ETFConstituent {
	id: string;
	target_weight: number;
	value: number;
	actual_weight: number;
	price: number;
}

export interface ETF {
	id: string;
	name: string;
	ticker: string;
	sector: string;
	nav: number;
	change_pct: number;
	change_amount: number;
	constituents: string[];
	weights: Record<string, number>;
	holdings: ETFConstituent[];
	expense_ratio: number;
	description: string;
	dividend_yield?: number;
	dividend_per_unit?: number;
	last_dividend_date?: string;
}

export interface ETFCandle {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface ETFUserHolding {
	etf_id: string;
	quantity: number;
	avg_price: number;
	current_price: number;
	profit_loss: number;
	profit_loss_pct: number;
}

export type ETFHoldingsResponse = {
	holdings: ETFUserHolding[];
	total_etf_value: number;
	cash_balance: number;
};

export interface ETFDividendRecord {
	etf_id: string;
	dividend_per_unit: number;
	total_dividend: number;
	payment_date: string;
	record_date: string;
}

export function getETFs() {
	return fetchFastAPI<{ etfs: ETF[] }>('/api/etfs');
}

export function getETFDetail(etfId: string) {
	return fetchFastAPI<ETF>(`/api/etfs/${etfId}`);
}

export async function getETFHistory(etfId: string, limit = 500, interval = 10) {
	const data = await fetchFastAPI<{ candles: ETFCandle[] }>(`/api/etfs/history/${etfId}?limit=${limit}&interval=${interval}`);
	return data.candles ?? [];
}

export function buyETF(etf_id: string, quantity: number) {
	return fetchFastAPI('/api/etfs/buy', {
		method: 'POST',
		body: JSON.stringify({ etf_id, quantity })
	});
}

export function sellETF(etf_id: string, quantity: number) {
	return fetchFastAPI('/api/etfs/sell', {
		method: 'POST',
		body: JSON.stringify({ etf_id, quantity })
	});
}

export async function getETFHoldings(opts?: { suppressAuth?: boolean }): Promise<ETFHoldingsResponse> {
	const data = await fetchFastAPI<ETFHoldingsResponse | null>('/api/etfs/holdings', opts?.suppressAuth ? { suppressAuth: true } : undefined);
	return {
		holdings: data?.holdings ?? [],
		total_etf_value: data?.total_etf_value ?? 0,
		cash_balance: data?.cash_balance ?? 0,
	};
}

export function getETFDividends(etfId: string) {
	return fetchFastAPI<{ dividends: ETFDividendRecord[] }>(`/api/etfs/${etfId}/dividends`);
}
