<script lang="ts">
    import { onMount } from 'svelte';
    import { getMyMissions, getMissions, getMissionStats, claimMission } from '$lib/api/mission';
    import type { UserMission, Mission } from '$lib/api/mission';

    let missions: UserMission[] = $state([]);
    let allMissions: Mission[] = $state([]);
    let stats: Record<string, unknown> = $state({});
    let loading = $state(true);
    let error = $state('');
    let claimingId: number | null = $state(null);
    let toastMsg = $state('');
    let toastError = $state(false);
    let activeTab: 'my' | 'catalog' = $state('my');

    const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
        EASY:   { label: '쉬움',   color: '#059669', bg: '#ecfdf5' },
        MEDIUM: { label: '보통',   color: '#d97706', bg: '#fffbeb' },
        HARD:   { label: '어려움', color: '#dc2626', bg: '#fef2f2' },
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
            toastMsg = '보상을 수령했습니다!';
            toastError = false;
            await load();
        } catch (e: unknown) {
            toastMsg = e instanceof Error ? e.message : '보상 수령에 실패했습니다.';
            toastError = true;
        } finally {
            claimingId = null;
        }
        setTimeout(() => { toastMsg = ''; }, 3000);
    }

    function formatReward(cash: number, fame: number): string {
        const parts: string[] = [];
        if (cash > 0) parts.push('$' + cash.toLocaleString());
        if (fame > 0) parts.push('명성 +' + fame);
        return parts.join(' · ');
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

    <nav class="tab-bar">
        <button class="tab-btn" class:active={activeTab === 'my'} onclick={() => activeTab = 'my'}>내 미션</button>
        <button class="tab-btn" class:active={activeTab === 'catalog'} onclick={() => activeTab = 'catalog'}>전체 미션</button>
    </nav>

    {#if loading}
        <div class="loading-state">데이터를 불러오는 중...</div>
    {:else if error}
        <div class="error-state">{error}</div>
    {:else if activeTab === 'catalog'}
        {#if allMissions.length === 0}
            <div class="empty-state">미션 목록이 없습니다.</div>
        {:else}
            <div class="mission-grid">
                {#each allMissions as m}
                    {@const diff = difficultyConfig[m.difficulty] ?? { label: m.difficulty, color: '#666', bg: '#f3f4f6' }}
                    {@const myMission = missions.find(um => um.mission.id === m.id)}
                    <div class="mission-card" class:claimed={myMission?.status === 'CLAIMED'}>
                        <div class="card-top">
                            <div class="card-title-row">
                                <h3 class="mission-name">{m.name}</h3>
                                <span class="diff-badge" style="color: {diff.color}; background: {diff.bg};">{diff.label}</span>
                            </div>
                            <p class="mission-desc">{m.description}</p>
                        </div>
                        <div class="card-bottom">
                            <div class="reward-row">
                                <span class="reward-label">보상</span>
                                <span class="reward-value">{formatReward(m.rewardCash, m.rewardFame)}</span>
                                {#if m.rewardItem}<span class="reward-item-badge">{m.rewardItem}</span>{/if}
                                {#if m.rewardTitle}<span class="reward-title-badge">{m.rewardTitle}</span>{/if}
                            </div>
                            <div class="status-row">
                                {#if myMission}
                                    <span class="status-badge" class:status-claimed={myMission.status === 'CLAIMED'} class:status-progress={myMission.status === 'IN_PROGRESS'} class:status-done={myMission.status === 'COMPLETED'}>
                                        {statusLabel[myMission.status] ?? myMission.status}
                                    </span>
                                {:else}
                                    <span class="status-badge">미시작</span>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {:else if missions.length === 0}
        <div class="empty-state">진행 중인 미션이 없습니다.</div>
    {:else}
        <div class="mission-grid">
            {#each missions as um}
                {@const diff = difficultyConfig[um.mission.difficulty] ?? { label: um.mission.difficulty, color: '#666', bg: '#f3f4f6' }}
                <div class="mission-card" class:claimed={um.status === 'CLAIMED'}>
                    <div class="card-top">
                        <div class="card-title-row">
                            <h3 class="mission-name">{um.mission.name}</h3>
                            <span class="diff-badge" style="color: {diff.color}; background: {diff.bg};">{diff.label}</span>
                        </div>
                        <p class="mission-desc">{um.mission.description}</p>
                    </div>

                    <div class="progress-section">
                        <div class="progress-label-row">
                            <span class="progress-label">진행도</span>
                            <span class="progress-value">{(um.progressPercentage ?? 0).toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div
                                class="progress-bar-fill"
                                class:fill-complete={um.progressPercentage >= 100}
                                style="width: {Math.min(um.progressPercentage, 100)}%"
                            ></div>
                        </div>
                        <div class="progress-sub">
                            {um.currentValue.toLocaleString()} / {um.mission.targetValue.toLocaleString()} {um.mission.targetType}
                        </div>
                    </div>

                    <div class="card-bottom">
                        <div class="reward-row">
                            <span class="reward-label">보상</span>
                            <span class="reward-value">{formatReward(um.mission.rewardCash, um.mission.rewardFame)}</span>
                            {#if um.mission.rewardItem}
                                <span class="reward-item-badge">{um.mission.rewardItem}</span>
                            {/if}
                            {#if um.mission.rewardTitle}
                                <span class="reward-title-badge">{um.mission.rewardTitle}</span>
                            {/if}
                        </div>

                        <div class="status-row">
                            {#if um.canClaim}
                                <button
                                    class="btn-claim"
                                    disabled={claimingId === um.id}
                                    onclick={() => handleClaim(um.id)}
                                >
                                    {claimingId === um.id ? '처리 중...' : '보상 수령'}
                                </button>
                            {:else}
                                <span class="status-badge" class:status-claimed={um.status === 'CLAIMED'} class:status-progress={um.status === 'IN_PROGRESS'} class:status-done={um.status === 'COMPLETED'}>
                                    {statusLabel[um.status] ?? um.status}
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if toastMsg}
    <div class="toast" class:toast-error={toastError}>{toastMsg}</div>
{/if}

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

    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-border); }
    .tab-btn { padding: 0.5rem 1.25rem; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text-gray); border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab-btn.active { color: var(--color-theme-1); border-bottom-color: var(--color-theme-1); font-weight: 600; }

    .stat-card {
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        min-width: 110px;
    }

    .stat-label { display: block; color: #666; font-size: 0.85rem; margin-bottom: 0.2rem; }
    .stat-value { display: block; font-size: 1.4rem; font-weight: 700; }

    .loading-state, .error-state, .empty-state {
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

    .diff-badge {
        border-radius: 20px;
        padding: 0.2rem 0.7rem;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .mission-desc { font-size: 0.85rem; color: var(--color-text-gray); margin: 0; line-height: 1.5; }

    .progress-section { display: flex; flex-direction: column; gap: 0.4rem; }

    .progress-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .progress-label { font-size: 0.8rem; color: var(--color-text-gray); font-weight: 600; }
    .progress-value { font-size: 0.85rem; font-weight: 700; color: var(--color-theme-1); }

    .progress-bar-bg {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-bar-fill {
        height: 100%;
        background: var(--color-theme-1);
        border-radius: 4px;
        transition: width 0.4s ease;
    }

    .progress-bar-fill.fill-complete { background: var(--color-positive); }

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

    .reward-item-badge, .reward-title-badge {
        background: #ECF2FE;
        color: var(--color-theme-1);
        border-radius: 4px;
        padding: 0.15rem 0.5rem;
        font-size: 0.72rem;
        font-weight: 600;
    }

    .btn-claim {
        width: 100%;
        background: var(--color-theme-1);
        color: white;
        border: none;
        padding: 0.7rem 1rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
    }
    .btn-claim:hover { background: #0b3d75; }
    .btn-claim:disabled { opacity: 0.6; cursor: not-allowed; }

    .status-badge {
        display: inline-block;
        padding: 0.35rem 0.85rem;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 700;
        background: #f3f4f6;
        color: #666;
    }

    .status-badge.status-progress { background: #ECF2FE; color: var(--color-theme-1); }
    .status-badge.status-done { background: #fffbeb; color: #d97706; }
    .status-badge.status-claimed { background: #ecfdf5; color: #059669; }

    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .toast.toast-error { background: #dc2626; }
</style>
