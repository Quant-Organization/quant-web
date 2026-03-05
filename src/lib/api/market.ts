import { fetchFastAPI } from './config';

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
	timestamp: string;
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

export interface FinancialReport {
	company_id: string;
	revenue: number;
	net_income: number;
	total_assets: number;
	total_equity: number;
	eps: number;
	bps: number;
	roe: number;
	per: number;
	pbr: number;
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

export async function getFinancials(companyId: string) {
	const data = await fetchFastAPI<{ summary: FinancialReport }>(`/financials/${companyId}`);
	return data.summary;
}

export function getSectorPerformance() {
	return fetchFastAPI<SectorPerformance>('/api/sectors/performance');
}
