import { fetchSpring } from './config';

export interface ClickInfo {
	currentLevel: number;
	incomePerClick: number;
	nextLevel: number;
	nextIncome: number;
	upgradeCost: number;
	totalClicks: number;
	currentBalance: number;
	isMaxLevel: boolean;
}

export interface ClickEarnResponse {
	earned: number;
	newBalance: number;
	totalClicks: number;
}

export interface ClickUpgradeResponse {
	success: boolean;
	newLevel: number;
	newIncomePerClick: number;
	remainingBalance: number;
	message: string;
}

export function getClickInfo() {
	return fetchSpring<ClickInfo>('/api/click/info');
}

export function clickEarn() {
	return fetchSpring<ClickEarnResponse>('/api/click/earn', { method: 'POST' });
}

export function clickUpgrade() {
	return fetchSpring<ClickUpgradeResponse>('/api/click/upgrade', { method: 'POST' });
}
