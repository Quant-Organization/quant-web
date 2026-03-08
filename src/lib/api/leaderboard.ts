import { fetchSpring } from './config';

export interface LeaderboardEntry {
	rank: number;
	username: string;
	playerName: string;
	level: number;
	title: string;
	totalAssetValue: number;
	previousRank: number;
	rankChange: number;
}

export function getTopRankers(limit = 50) {
	return fetchSpring<LeaderboardEntry[]>(`/api/leaderboard/top?limit=${limit}`);
}

export function getMyRank() {
	return fetchSpring<LeaderboardEntry>('/api/leaderboard/my-rank');
}
