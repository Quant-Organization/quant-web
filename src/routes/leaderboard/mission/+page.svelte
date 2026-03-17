<script lang="ts">
    import { onMount } from 'svelte';
    import { getMyMissions, getMissions, getMissionStats, claimMission } from '$lib/api/mission';
    import type { UserMission, Mission } from '$lib/api/mission';
    import SkeletonTable from '$lib/components/SkeletonTable.svelte';
    import { toast } from 'svelte-sonner';
    import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import { Badge } from '$lib/components/ui/badge';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';

    let missions: UserMission[] = $state([]);
    let allMissions: Mission[] = $state([]);
    let stats: Record<string, unknown> = $state({});
    let loading = $state(true);
    let error = $state('');
    let claimingId: number | null = $state(null);
    let activeTab: 'my' | 'catalog' = $state('my');
    let sortMode: 'recommended' | 'difficultyAsc' | 'difficultyDesc' = $state('recommended');

    const difficultyConfig: Record<string, { order: number }> = {
        EASY: { order: 0 },
        NORMAL: { order: 1 },
        MEDIUM: { order: 2 },
        HARD: { order: 3 },
    };

    const statusLabel: Record<string, string> = {
        IN_PROGRESS: '진행 중',
        COMPLETED: '완료',
        CLAIMED: '수령 완료',
    };

    onMount(async () => {
        await load();
    });

    async function load() {
        try {
            const [myRes, all, s] = await Promise.all([
                getMyMissions(),
                getMissions().catch(() => [] as Mission[]),
                getMissionStats().catch(() => ({} as Record<string, unknown>)),
            ]);
            // Server returns { IN_PROGRESS: [...], COMPLETED: [...], CLAIMED: [...] }
            missions = Object.values(myRes).flat();
            allMissions = all;
            stats = s;
        } catch (e) {
            error = '미션 데이터를 불러오는 중 오류가 발생했습니다.';
        } finally {
            loading = false;
        }
    }

    async function handleClaim(missionId: number) {
        claimingId = missionId;
        try {
            await claimMission(missionId);
            toast.success('보상을 수령했습니다!');
            await load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '보상 수령에 실패했습니다.');
        } finally {
            claimingId = null;
        }
    }

    function formatReward(cash: number, fame: number, exp?: number): string {
        const parts: string[] = [];
        if (cash > 0) parts.push('$' + cash.toLocaleString());
        if (fame > 0) parts.push('명성 +' + fame);
        if (exp && exp > 0) parts.push('경험치 +' + exp);
        return parts.join(' · ');
    }

    function missionPriority(um: UserMission): number {
        if (um.canClaim || um.status === 'COMPLETED') return 0;
        if (um.status === 'CLAIMED') return 2;
        return 1;
    }

    function difficultyOrder(difficulty: string): number {
        return difficultyConfig[difficulty]?.order ?? 99;
    }

    const sortedMissions = $derived([...missions].sort((a, b) => {
        if (sortMode === 'difficultyAsc') {
            const d = difficultyOrder(a.mission.difficulty) - difficultyOrder(b.mission.difficulty);
            if (d !== 0) return d;
            return (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0);
        }
        if (sortMode === 'difficultyDesc') {
            const d = difficultyOrder(b.mission.difficulty) - difficultyOrder(a.mission.difficulty);
            if (d !== 0) return d;
            return (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0);
        }

        const p = missionPriority(a) - missionPriority(b);
        if (p !== 0) return p;
        return (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0);
    }));

    const sortedCatalogMissions = $derived([...allMissions].sort((a, b) => {
        if (sortMode === 'difficultyAsc') return difficultyOrder(a.difficulty) - difficultyOrder(b.difficulty);
        if (sortMode === 'difficultyDesc') return difficultyOrder(b.difficulty) - difficultyOrder(a.difficulty);
        return a.id - b.id;
    }));

    function difficultyBadgeClass(difficulty: string): string {
        switch (difficulty) {
            case 'EASY': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'NORMAL': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'HARD': return 'bg-red-50 text-red-600 border-red-200';
            default: return '';
        }
    }

    function statusBadgeClass(status: string): string {
        switch (status) {
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'COMPLETED': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'CLAIMED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default: return '';
        }
    }
</script>

<div class="page-container">
    <header class="page-header">
        <div class="header-text">
            <h1>미션</h1>
            <p>미션을 완료하고 보상을 수령하세요.</p>
        </div>
        {#if !loading && !error}
            <div class="stats-cards">
                <div class="stat-card">
                    <span class="stat-label">진행 중인 미션</span>
                    <span class="stat-value">{missions.length}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">수령 가능</span>
                    <span class="stat-value">{missions.filter(m => m.canClaim).length}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">완료</span>
                    <span class="stat-value">{missions.filter(m => m.status === 'CLAIMED').length}</span>
                </div>
                {#if typeof stats.total === 'number'}
                <div class="stat-card">
                    <span class="stat-label">전체 미션 수</span>
                    <span class="stat-value">{stats.total}</span>
                </div>
                {/if}
            </div>
        {/if}
    </header>

    <div class="tabs-row">
        <Tabs value={activeTab} onValueChange={(v) => activeTab = v as 'my' | 'catalog'}>
            <TabsList>
                <TabsTrigger value="my">내 미션</TabsTrigger>
                <TabsTrigger value="catalog">전체 미션</TabsTrigger>
            </TabsList>
        </Tabs>
        <div class="sort-wrap">
            <label for="mission-sort" class="sort-label">정렬</label>
            <select id="mission-sort" class="sort-select" bind:value={sortMode}>
                <option value="recommended">기본</option>
                <option value="difficultyAsc">난이도 낮은순</option>
                <option value="difficultyDesc">난이도 높은순</option>
            </select>
        </div>
    </div>

    {#if loading}
        <SkeletonTable rows={6} cols={3} showStats={true} />
    {:else if error}
        <div class="error-state">{error}</div>
    {:else if activeTab === 'catalog'}
        {#if sortedCatalogMissions.length === 0}
            <div class="empty-state">미션 목록이 없습니다.</div>
        {:else}
            <div class="mission-grid">
                {#each sortedCatalogMissions as m}
                    {@const myMission = missions.find(um => um.mission.id === m.id)}
                    <div class="mission-card" class:claimed={myMission?.status === 'CLAIMED'}>
                        <div class="card-top">
                            <div class="card-title-row">
                                <h3 class="mission-name">{m.name}</h3>
                                <Badge variant="outline" class={difficultyBadgeClass(m.difficulty)}>{m.difficulty}</Badge>
                            </div>
                            <p class="mission-desc">{m.description}</p>
                        </div>
                        <div class="card-bottom">
                            <div class="reward-row">
                                <span class="reward-label">보상</span>
                                <span class="reward-value">{formatReward(m.rewardCash, m.rewardFame, m.rewardExperience)}</span>
                                {#if m.rewardItem}<Badge variant="secondary" class="text-xs">{m.rewardItem}</Badge>{/if}
                                {#if m.rewardTitle}<Badge variant="secondary" class="text-xs">{m.rewardTitle}</Badge>{/if}
                            </div>
                            <div class="status-row">
                                {#if myMission}
                                    <Badge variant="outline" class={statusBadgeClass(myMission.status)}>
                                        {statusLabel[myMission.status] ?? myMission.status}
                                    </Badge>
                                {:else}
                                    <Badge variant="secondary">미시작</Badge>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {:else if sortedMissions.length === 0}
        <div class="empty-state">진행 중인 미션이 없습니다.</div>
    {:else}
        <div class="mission-grid">
            {#each sortedMissions as um}
                <div class="mission-card" class:claimed={um.status === 'CLAIMED'}>
                    <div class="card-top">
                        <div class="card-title-row">
                            <h3 class="mission-name">{um.mission.name}</h3>
                            <Badge variant="outline" class={difficultyBadgeClass(um.mission.difficulty)}>{um.mission.difficulty}</Badge>
                        </div>
                        <p class="mission-desc">{um.mission.description}</p>
                    </div>

                    <div class="progress-section">
                        <div class="progress-label-row">
                            <span class="progress-label">진행도</span>
                            <span class="progress-value">{(um.progressPercentage ?? 0).toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={Math.min(um.progressPercentage, 100)}
                            class={um.progressPercentage >= 100 ? 'progress-complete' : ''}
                        />
                        <div class="progress-sub">
                            {um.currentValue.toLocaleString()} / {um.mission.targetValue.toLocaleString()} {um.mission.targetType}
                        </div>
                    </div>

                    <div class="card-bottom">
                        <div class="reward-row">
                            <span class="reward-label">보상</span>
                            <span class="reward-value">{formatReward(um.mission.rewardCash, um.mission.rewardFame, um.mission.rewardExperience)}</span>
                            {#if um.mission.rewardItem}
                                <Badge variant="secondary" class="text-xs">{um.mission.rewardItem}</Badge>
                            {/if}
                            {#if um.mission.rewardTitle}
                                <Badge variant="secondary" class="text-xs">{um.mission.rewardTitle}</Badge>
                            {/if}
                        </div>

                        <div class="status-row">
                            {#if um.canClaim}
                                {@const missionId = um.mission.id}
                                <Button
                                    class="w-full"
                                    disabled={claimingId === missionId}
                                    onclick={() => handleClaim(missionId)}
                                >
                                    {claimingId === missionId ? '처리 중...' : '보상 수령'}
                                </Button>
                            {:else}
                                <Badge variant="outline" class={statusBadgeClass(um.status)}>
                                    {statusLabel[um.status] ?? um.status}
                                </Badge>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .page-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .header-text h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .header-text p { font-size: 1rem; color: var(--color-text-gray); margin: 0; }

    .stats-cards { display: flex; gap: 1rem; flex-wrap: wrap; }

    .tabs-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .sort-wrap { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
    .sort-label { font-size: 0.82rem; color: var(--color-text-gray); font-weight: 600; }
    .sort-select {
        border: 1px solid var(--color-border);
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        font-size: 0.85rem;
        color: #111;
        background: #fff;
    }

    .stat-card {
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        min-width: 110px;
    }

    .stat-label { display: block; color: #666; font-size: 0.85rem; margin-bottom: 0.2rem; }
    .stat-value { display: block; font-size: 1.4rem; font-weight: 700; }

    .error-state, .empty-state {
        display: flex; align-items: center; justify-content: center;
        min-height: 40vh; font-size: 1rem; color: var(--color-text-gray);
    }
    .error-state { color: var(--color-negative); }

    .mission-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.25rem;
    }

    .mission-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        transition: box-shadow 0.15s;
    }

    .mission-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    .mission-card.claimed { opacity: 0.6; }

    .card-title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .mission-name { font-size: 1rem; font-weight: 700; margin: 0; flex: 1; }

    .mission-desc { font-size: 0.85rem; color: var(--color-text-gray); margin: 0; line-height: 1.5; }

    .progress-section { display: flex; flex-direction: column; gap: 0.4rem; }

    .progress-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .progress-label { font-size: 0.8rem; color: var(--color-text-gray); font-weight: 600; }
    .progress-value { font-size: 0.85rem; font-weight: 700; color: var(--color-theme-1); }

    .progress-sub { font-size: 0.75rem; color: var(--color-text-gray); }

    .card-bottom { display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto; }

    .reward-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .reward-label { font-size: 0.8rem; color: var(--color-text-gray); font-weight: 600; }
    .reward-value { font-size: 0.9rem; font-weight: 700; color: #111; }

    :global(.progress-complete [data-slot="progress-indicator"]) {
        background-color: var(--color-positive);
    }
</style>
