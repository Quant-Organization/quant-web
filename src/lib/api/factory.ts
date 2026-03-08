import { fetchSpring } from './config';

export interface FactoryResponse {
	id: number;
	name: string;
	companyId: number;
	companyName: string;
	regionId: number;
	regionName: string;
	grade: string;
	productionLineType: string;
	landExpansionLevel: number;
	buildingExpansionLevel: number;
	loungeLevel: number;
	energyOption: string;
	securityOption: string;
	baseMonthlyProduction: number;
	currentMonthlyProduction: number;
	employeeCount: number;
	efficiency: number;
	currentInventory: number;
	warehouseCapacity: number;
	constructionCost: number;
	monthlyRevenue: number;
	monthlyLaborCost: number;
	monthlyMaterialCost: number;
	monthlyElectricityCost: number;
	monthlyNetIncome: number;
	status: string;
	constructionStartDate: string;
	constructionEndDate: string;
	createdAt: string;
	updatedAt: string;
}

export interface FactoryGrade {
	grade: string;
	displayName: string;
	monthlyProduction: number;
	employeeCount: number;
	baseConstructionCost: number;
	requiredLevel: number;
}

export interface CreateFactoryRequest {
	companyId: number;
	name: string;
	regionId: number;
	grade: string;
	productionLineType: string;
	landExpansionLevel: number;
	buildingExpansionLevel: number;
	loungeLevel: number;
	energyOption: string;
	securityOption: string;
}

export interface FactoryEstimate {
	totalCost: number;
	baseCost: number;
	optionCost: number;
	regionCostMultiplier: number;
	estimatedDays: number;
	estimatedCompletionDate: string;
	monthlyProduction: number;
	employeeCount: number;
	warehouseCapacity: number;
}

export function getMyFactories(page = 0, size = 20) {
	return fetchSpring<{ factories: FactoryResponse[]; totalElements: number; totalPages: number; currentPage: number }>(`/api/factories/my?page=${page}&size=${size}`);
}

export function getFactoryDetail(id: number) {
	return fetchSpring<FactoryResponse>(`/api/factories/${id}`);
}

export function getCompanyFactories(companyId: number) {
	return fetchSpring<FactoryResponse[]>(`/api/factories/company/${companyId}`);
}

export function getFactoryGrades() {
	return fetchSpring<FactoryGrade[]>('/api/factories/grades');
}

export function getAvailableFactoryGrades() {
	return fetchSpring<FactoryGrade[]>('/api/factories/grades/available');
}

export function createFactory(req: CreateFactoryRequest) {
	return fetchSpring('/api/factories', { method: 'POST', body: JSON.stringify(req) });
}

export function estimateFactory(req: CreateFactoryRequest) {
	return fetchSpring<FactoryEstimate>('/api/factories/estimate', {
		method: 'POST',
		body: JSON.stringify(req)
	});
}

export function pauseFactory(id: number) {
	return fetchSpring(`/api/factories/${id}/pause`, { method: 'PUT' });
}

export function resumeFactory(id: number) {
	return fetchSpring(`/api/factories/${id}/resume`, { method: 'PUT' });
}

export function adjustProduction(id: number, percentage: number) {
	return fetchSpring(`/api/factories/${id}/production?percentage=${percentage}`, { method: 'PUT' });
}

export function deleteFactory(id: number) {
	return fetchSpring(`/api/factories/${id}`, { method: 'DELETE' });
}
