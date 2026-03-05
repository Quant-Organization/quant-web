import { fetchSpring } from './config';

export interface AccountSummary {
	cashBalance: number;
	totalAssetValue: number;
	passiveIncomePerSecond: number;
	clickIncomePerClick: number;
}

export interface AssetSummary {
	vehicleCount: number;
	jetCount: number;
	yachtCount: number;
	realEstateCount: number;
	luxuryCount: number;
	totalAssetValue: number;
}

export interface BusinessSummary {
	companyCount: number;
	factoryCount: number;
	totalMonthlyRevenue: number;
	totalMonthlyProfit: number;
}

export interface IncomeSummary {
	clickIncome: number;
	passiveIncome: number;
	businessIncome: number;
	rentalIncome: number;
	dividendIncome: number;
	stockTradingIncome: number;
	cryptoTradingIncome: number;
}

export interface RankInfo {
	rank: number;
	previousRank: number;
	rankChange: number;
	percentile: number;
}

export interface DashboardData {
	account: AccountSummary;
	assets: AssetSummary;
	business: BusinessSummary;
	missions: Record<string, unknown>;
	income: IncomeSummary;
	rank: RankInfo;
}

export interface ProfileStats {
	companyCount: number;
	realEstateCount: number;
	vehicleCount: number;
	jetCount: number;
	yachtCount: number;
	luxuryCount: number;
	factoryCount: number;
	clickIncome: number;
	businessIncome: number;
	rentalIncome: number;
	dividendIncome: number;
	stockTradingIncome: number;
	cryptoTradingIncome: number;
	currentBalance: number;
	businessValue: number;
	stockValue: number;
	realEstateValue: number;
	transportValue: number;
	collectionValue: number;
	cryptoValue: number;
	totalAssetValue: number;
	investmentStyle: string;
	title: string;
}

export interface SpringAccount {
	id: number;
	userId: number;
	cashBalance: number;
	totalAssetValue: number;
	clickIncomeLevel: number;
	clickIncomePerClick: number;
	passiveIncomePerSecond: number;
	totalClicks: number;
}

export function getDashboard() {
	return fetchSpring<DashboardData>('/api/dashboard');
}

export function getProfileStats() {
	return fetchSpring<ProfileStats>('/api/dashboard/profile');
}

export function getSpringAccount() {
	return fetchSpring<SpringAccount>('/api/account');
}
