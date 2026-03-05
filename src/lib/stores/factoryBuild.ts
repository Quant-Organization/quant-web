import { writable, get } from 'svelte/store';

export interface FactoryBuildState {
	companyId: number;
	// Step 1
	grade: string;
	gradeName: string;
	regionId: number;
	regionName: string;
	// Step 2
	name: string;
	productionLineType: string;
	landExpansionLevel: number;
	buildingExpansionLevel: number;
	loungeLevel: number;
	energyOption: string;
	securityOption: string;
}

const initialState: FactoryBuildState = {
	companyId: 0,
	grade: '',
	gradeName: '',
	regionId: 0,
	regionName: '',
	name: '',
	productionLineType: 'general',
	landExpansionLevel: 1,
	buildingExpansionLevel: 1,
	loungeLevel: 1,
	energyOption: 'std',
	securityOption: 'std'
};

export const factoryBuild = writable<FactoryBuildState>({ ...initialState });

export function updateFactoryBuild(partial: Partial<FactoryBuildState>) {
	factoryBuild.update((s) => ({ ...s, ...partial }));
}

export function resetFactoryBuild() {
	factoryBuild.set({ ...initialState });
}

export function getFactoryBuild(): FactoryBuildState {
	return get(factoryBuild);
}
