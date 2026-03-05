import { fetchSpring } from './config';

export interface Region {
	id: number;
	name: string;
	regionType: string;
	costMultiplier: number;
	revenueMultiplier: number;
	constructionSpeedMultiplier: number;
	polygonCoordinates: string;
	createdAt: string;
}

export function getRegions() {
	return fetchSpring<Region[]>('/api/regions');
}

export function getRegionDetail(id: number) {
	return fetchSpring<Region>(`/api/regions/${id}`);
}

export function getRegionsByType(regionType: string) {
	return fetchSpring<Region[]>(`/api/regions/type/${regionType}`);
}
