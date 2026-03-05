import { fetchSpring } from './config';

export interface Mission {
	id: number;
	name: string;
	description: string;
	targetType: string;
	targetValue: number;
	rewardCash: number;
	rewardFame: number;
	rewardItem: string;
	rewardTitle: string;
	difficulty: string;
}

export interface UserMission {
	id: number;
	mission: Mission;
	currentValue: number;
	progressPercentage: number;
	status: string;
	completedAt: string | null;
	claimedAt: string | null;
	canClaim: boolean;
}

export type MyMissionsResponse = Record<string, UserMission[]>;

export function getMissions() {
	return fetchSpring<Mission[]>('/api/missions');
}

export function getMyMissions() {
	return fetchSpring<MyMissionsResponse>('/api/missions/my');
}

export function getMissionStats() {
	return fetchSpring<Record<string, unknown>>('/api/missions/stats');
}

export function claimMission(missionId: number) {
	return fetchSpring(`/api/missions/${missionId}/claim`, { method: 'POST' });
}
