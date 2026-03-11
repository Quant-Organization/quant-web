import { fetchFastAPI } from './config';
import { setCachedCurrency, type CurrencyCode } from '$lib/utils/currency';

export interface Company {
	company_id: string;
	name: string;
	initial_price: number;
}

export interface PriceMap {
	prices: Record<string, number>;
}

export interface Valuation {
	fair_value: number;
	current_price: number;
	deviation_pct: number;
	eps: number;
	bps: number;
	current_per: number;
	current_pbr: number;
	roe: number;
}

export interface CandleData {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface NewsItem {
	id: string;
	title: string;
	content: string;
	company_id: string;
	impact: string;
	created_at: string;
}

export interface FinancialSummary {
	company_id: string;
	company_name: string;
	sector: string;
	current_price: number;
	market_cap: number;
	shares_outstanding: number;
	revenue: number;
	operating_income: number;
	net_income: number;
	operating_margin: number;
	net_margin: number;
	base_equity: number;
	eps: number;
	bps: number;
}

export interface QuarterlyReport {
	quarter: string;
	timestamp: string;
	revenue: number;
	operating_income: number;
	net_income: number;
	revenue_growth_yoy: number;
	operating_margin: number;
	net_margin: number;
	roe: number;
	per: number;
	pbr: number;
}

export interface FinancialData {
	summary: FinancialSummary;
	quarterly_history: QuarterlyReport[];
	currency: CurrencyCode;
}

export interface SectorPerformance {
	sector_performance: Record<string, number>;
	top_sectors: Array<{ sector: string; change_pct: number }>;
}

export function getCompanies() {
	return fetchFastAPI<Company[]>('/api/market/companies');
}

export function getPrices() {
	return fetchFastAPI<PriceMap>('/api/market/prices');
}

export function getValuation(companyId: string) {
	return fetchFastAPI<Valuation>(`/api/market/valuation/${companyId}`);
}

export function getHistory(companyId: string, limit = 500, interval = 5) {
	return fetchFastAPI<CandleData[]>(`/api/market/history/${companyId}?limit=${limit}&interval=${interval}`);
}

export async function getNews(companyId: string) {
	const data = await fetchFastAPI<{ news: NewsItem[] }>(`/api/news/${companyId}`);
	return data.news ?? [];
}

export async function getFinancials(companyId: string): Promise<FinancialData> {
	const data = await fetchFastAPI<FinancialData>(`/financials/${companyId}`);
	if (data.currency) setCachedCurrency(companyId, data.currency);
	return data;
}

/** 여러 회사의 통화 정보를 서버에서 미리 로드 (캐시) */
export async function loadCompanyCurrencies(companyIds: string[]): Promise<void> {
	const unique = [...new Set(companyIds)];
	await Promise.allSettled(unique.map(id => getFinancials(id)));
}

export function getSectorPerformance() {
	return fetchFastAPI<SectorPerformance>('/api/sectors/performance');
}
