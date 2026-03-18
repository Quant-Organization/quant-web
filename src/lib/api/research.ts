import { fetchSpring } from './config';

export interface ResearchProjectResponse {
	id: number;
	code: string;
	name: string;
	category: string;
	categoryName: string;
	level: number;
	description: string;
	effectType: string;
	effectTypeName: string;
	effectValue: number;
	effectDescription: string;
	requiredBudget: number;
	requiredDays: number; // 서버에서 시간(hours) 단위로 반환
	requiredResearchers: number;
	prerequisiteProjectId: number | null;
	imageUrl: string;
	requiredLevel: number;
	isCompleted: boolean;
	canStart: boolean;
}

export interface ResearchCenterResponse {
	id: number;
	companyId: number;
	companyName: string;
	monthlyInvestment: number;
	dailyInvestment: number; // 일일 투자액 (월 투자액 / 30)
	totalResearchers: number;
	availableResearchers: number;
	assignedResearchers: number;
	researchSpeedBonus: number; // 설정된 투자액 기준 보너스 (%)
	activeSpeedBonus: number; // 실제 적용 중인 보너스 (%)
	lastInvestmentDate: string | null; // 마지막 투자 성공 날짜
	investmentActive: boolean; // 오늘 투자 성공 여부
	level: number;
}

export interface UserResearchResponse {
	id: number;
	project: ResearchProjectResponse;
	assignedResearchers: number;
	startDate: string;
	estimatedEndDate: string;
	actualEndDate: string | null;
	progressPercent: number;
	investedAmount: number;
	status: string;
	statusName: string;
	remainingHours: number;
}

export interface CompletedResearchResponse {
	id: number;
	companyId: number;
	companyName: string;
	project: ResearchProjectResponse;
	completedDate: string;
	effectType: string;
	effectTypeName: string;
	effectValue: number;
	effectDescription: string;
	isActive: boolean;
}

export interface StartResearchRequest {
	researchCenterId: number;
	projectId: number;
	assignedResearchers: number;
}

export function getResearchProjects() {
	return fetchSpring<ResearchProjectResponse[]>('/api/research/projects');
}

export function getResearchProjectsByCategory(category: string) {
	return fetchSpring<ResearchProjectResponse[]>(`/api/research/projects/category/${category}`);
}

export function getResearchCenters() {
	return fetchSpring<ResearchCenterResponse[]>('/api/research/centers');
}

export function createResearchCenter(companyId: number) {
	return fetchSpring<ResearchCenterResponse>(`/api/research/centers?companyId=${companyId}`, {
		method: 'POST'
	});
}

export function hireResearcher(centerId: number, count: number) {
	return fetchSpring<ResearchCenterResponse>(`/api/research/centers/${centerId}/hire?count=${count}`, {
		method: 'POST'
	});
}

export function fireResearcher(centerId: number, count: number) {
	return fetchSpring<ResearchCenterResponse>(`/api/research/centers/${centerId}/fire?count=${count}`, {
		method: 'POST'
	});
}

export function setInvestment(centerId: number, monthlyInvestment: number) {
	return fetchSpring<ResearchCenterResponse>(`/api/research/centers/${centerId}/investment`, {
		method: 'PUT',
		body: JSON.stringify({ monthlyInvestment })
	});
}

export function startResearch(req: StartResearchRequest) {
	return fetchSpring<UserResearchResponse>('/api/research/start', {
		method: 'POST',
		body: JSON.stringify(req)
	});
}

export function cancelResearch(researchId: number) {
	return fetchSpring(`/api/research/${researchId}/cancel`, { method: 'POST' });
}

export function getActiveResearch() {
	return fetchSpring<UserResearchResponse[]>('/api/research/active');
}

export function getCompletedResearch() {
	return fetchSpring<CompletedResearchResponse[]>('/api/research/completed');
}

export function getResearchEffects(companyId: number) {
	return fetchSpring<CompletedResearchResponse[]>(`/api/research/effects/company/${companyId}`);
}
