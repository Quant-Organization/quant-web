import { fetchSpring } from './config';

export interface ProductResponse {
	id: number;
	code: string;
	name: string;
	category: string;
	description: string;
	baseUnitPrice: number;
	productionCostPerUnit: number;
	requiredCompanyType: string;
	imageUrl: string;
	requiredLevel: number;
}

export interface FactoryProductResponse {
	id: number;
	factoryId: number;
	factoryName: string;
	product: ProductResponse;
	currentInventory: number;
	monthlyProductionCapacity: number;
	currentMonthlyProduction: number;
	productionCostMultiplier: number;
	baseQualityScore: number;
	baseQualityGrade: string;
	isActive: boolean;
	inventoryGradeA: number;
	inventoryGradeB: number;
	inventoryGradeC: number;
	inventoryGradeD: number;
	autoSellEnabled: boolean;
}

export interface SetProductionRequest {
	productId: number;
	monthlyProduction: number;
}

export function getProducts() {
	return fetchSpring<ProductResponse[]>('/api/products');
}

export function getProductsByCategory(category: string) {
	return fetchSpring<ProductResponse[]>(`/api/products/category/${category}`);
}

export function getAvailableProducts(companyType: string) {
	return fetchSpring<ProductResponse[]>(`/api/products/available/${companyType}`);
}

export function getFactoryProduction(factoryId: number) {
	return fetchSpring<FactoryProductResponse[]>(`/api/products/factories/${factoryId}/production`);
}

export function setFactoryProduction(factoryId: number, req: SetProductionRequest) {
	return fetchSpring<FactoryProductResponse>(`/api/products/factories/${factoryId}/production`, {
		method: 'POST',
		body: JSON.stringify(req)
	});
}

export function removeFactoryProduction(factoryId: number, productId: number) {
	return fetchSpring(`/api/products/factories/${factoryId}/production/${productId}`, {
		method: 'DELETE'
	});
}

export function setAutoSell(factoryId: number, productId: number, enabled: boolean) {
	return fetchSpring(`/api/products/factories/${factoryId}/production/${productId}/auto-sell?enabled=${enabled}`, {
		method: 'PUT'
	});
}

export function getInventory() {
	return fetchSpring<FactoryProductResponse[]>('/api/products/inventory');
}
