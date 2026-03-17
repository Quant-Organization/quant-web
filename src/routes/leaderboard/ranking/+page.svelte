<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { getTopRankers, getMyRank, type LeaderboardEntry } from '$lib/api/leaderboard';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '$lib/components/ui/tooltip';
  import { Separator } from '$lib/components/ui/separator';
  import { Card, CardContent } from '$lib/components/ui/card';

  // --- State ---
  let players = $state<LeaderboardEntry[]>([]);
  let myRank = $state<LeaderboardEntry | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchText = $state('');

  // --- Derived ---
  let filteredPlayers = $derived(
    players.filter((p) =>
      (p.playerName ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
      (p.username ?? '').toLowerCase().includes(searchText.toLowerCase())
    )
  );

  let topStats = $derived([
    {
      label: '내 현재 순위',
      mainValue: myRank ? `#${myRank.rank.toLocaleString()}` : '-',
      subValue: myRank && myRank.rankChange !== 0
        ? (myRank.rankChange > 0 ? `↑${myRank.rankChange}위 상승` : `↓${Math.abs(myRank.rankChange)}위 하락`)
        : '-',
      subValueColor: myRank && myRank.rankChange > 0 ? 'green' : myRank && myRank.rankChange < 0 ? 'red' : 'gray',
      iconType: 'medal' as const,
      tooltip: myRank
        ? `현재 ${myRank.rank}위 · ${myRank.rankChange > 0 ? `${myRank.rankChange}위 상승` : myRank.rankChange < 0 ? `${Math.abs(myRank.rankChange)}위 하락` : '변동 없음'}`
        : '로그인 후 확인 가능합니다'
    },
    {
      label: '1위 총 자산',
      mainValue: players[0] ? formatAsset(players[0].totalAssetValue) : '-',
      subValue: players[0] ? (players[0].playerName ?? players[0].username) : '',
      subValueColor: 'gray' as const,
      iconType: 'chart' as const,
      tooltip: players[0] ? `정확한 자산: $${players[0].totalAssetValue.toLocaleString()}` : '-'
    },
    {
      label: '상위 플레이어',
      mainValue: players[0] ? (players[0].playerName ?? players[0].username) : '-',
      subValue: players[0] ? (players[0].title ?? '') : '',
      subValueColor: 'gray' as const,
      iconType: 'crown' as const,
      tooltip: players[0] ? `레벨 ${players[0].level}` : '-'
    }
  ]);

  function formatAsset(n: number): string {
    if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + String(n);
  }

  function getRankColorClass(rank: number) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-default';
  }

  function getAvatarUrl(username: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  }

  onMount(async () => {
    try {
      const [topRes, myRes] = await Promise.allSettled([
        getTopRankers(50),
        getMyRank()
      ]);
      if (topRes.status === 'fulfilled') players = topRes.value;
      if (myRes.status === 'fulfilled') myRank = myRes.value;
    } catch (e) {
      error = '데이터를 불러오지 못했습니다.';
      toast.error('랭킹 데이터를 불러오지 못했습니다.');
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>리더보드</title>
</svelte:head>

<div class="page-container">

  <header class="page-header">
    <div class="header-text">
      <h1>리더보드</h1>
      <p>전 세계 억만장자 플레이어들과 경쟁하고 최고의 투자자가 되어보세요.</p>
    </div>
  </header>

  {#if loading}
    <SkeletonTable rows={10} cols={4} showHeader={false} showStats={true} />
  {:else if error}
    <div class="error-state">{error}</div>
  {:else}
    <TooltipProvider>
      <section class="stats-grid">
        {#each topStats as stat}
          <Card class="stat-card-wrapper">
            <CardContent class="stat-card-content">
              <div class="stat-content">
                <span class="stat-label">{stat.label}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <div class="stat-values">
                      <span class="main-val">{stat.mainValue}</span>
                      {#if stat.subValue}
                        <span class="sub-val {stat.subValueColor}">{stat.subValue}</span>
                      {/if}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{stat.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div class="stat-icon">
                {#if stat.iconType === 'medal'}
                  <div class="circle-icon gold">🥇</div>
                {:else if stat.iconType === 'crown'}
                  <div class="circle-icon green">👑</div>
                {/if}
              </div>
            </CardContent>
          </Card>
        {/each}
      </section>

      <Separator class="my-separator" />

      <section class="ranking-container">

        <div class="ranking-controls">
          <h2>실시간 랭킹</h2>
          <div class="control-right">
            <div class="search-box">
              <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="플레이어 검색" bind:value={searchText} />
            </div>
            <Button variant="outline" class="filter-btn-override">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              필터
            </Button>
          </div>
        </div>

        <div class="ranking-table">
          <div class="table-header">
            <div class="col-rank">순위</div>
            <div class="col-player">플레이어</div>
            <div class="col-tag">칭호</div>
            <div class="col-assets">총 자산 가치</div>
            <div class="col-return">순위 변동</div>
          </div>

          <div class="table-body">
            {#if filteredPlayers.length === 0}
              <div class="empty-row">검색 결과가 없습니다.</div>
            {/if}
            {#each filteredPlayers as player}
              <div class="table-row" class:my-rank={myRank?.username === player.username}>

                <div class="col-rank">
                  <div class="rank-circle {getRankColorClass(player.rank)}">
                    {player.rank}
                  </div>
                  <div class="rank-change {player.rankChange > 0 ? 'up' : player.rankChange < 0 ? 'down' : 'neutral'}">
                    {#if player.rankChange > 0}
                      ↑{player.rankChange}
                    {:else if player.rankChange < 0}
                      ↓{Math.abs(player.rankChange)}
                    {:else}
                      -
                    {/if}
                  </div>
                </div>

                <div class="col-player flex-align">
                  <img src={getAvatarUrl(player.username)} alt="avatar" class="avatar" />
                  <div class="player-info">
                    <span class="p-name">{player.playerName ?? player.username}</span>
                    <span class="p-level">Level {player.level}{player.title ? ` · ${player.title}` : ''}</span>
                  </div>
                </div>

                <div class="col-tag">
                  {#if player.title}
                    <Badge variant="outline">{player.title}</Badge>
                  {/if}
                </div>

                <div class="col-assets font-bold">
                  {formatAsset(player.totalAssetValue)}
                </div>

                <div class="col-return font-bold {player.rankChange > 0 ? 'text-green' : player.rankChange < 0 ? 'text-red' : ''}">
                  {#if player.rankChange > 0}
                    +{player.rankChange}
                  {:else if player.rankChange < 0}
                    {player.rankChange}
                  {:else}
                    -
                  {/if}
                </div>

              </div>
            {/each}
          </div>
        </div>
      </section>
    </TooltipProvider>
  {/if}
</div>

<style>
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  .header-text h1 {
    font-size: var(--page-title-size);
    font-weight: var(--page-title-weight);
    margin: 0 0 0.5rem 0;
  }

  .header-text p {
    font-size: var(--page-desc-size);
    color: var(--color-text-gray);
    margin: 0;
  }

  .loading-state,
  .error-state {
    text-align: center;
    padding: 60px 0;
    color: var(--color-text-gray);
    font-size: 15px;
  }
  .error-state { color: var(--color-negative); }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  /* Override Card padding/layout to match original stat-card */
  :global(.stat-card-wrapper) {
    background: var(--color-bg-1) !important;
    border-color: var(--color-border) !important;
    box-shadow: var(--card-shadow) !important;
  }

  :global(.stat-card-content) {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: var(--card-padding) !important;
  }

  .stat-label {
    display: block;
    font-size: var(--stat-label-size);
    color: var(--stat-label-color);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .stat-values {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    cursor: default;
  }

  .main-val {
    font-size: var(--stat-value-size);
    font-weight: var(--stat-value-weight);
    letter-spacing: -0.5px;
  }

  .sub-val {
    font-size: var(--stat-change-size);
    font-weight: var(--stat-change-weight);
  }
  .sub-val.green { color: var(--stat-change-positive); }
  .sub-val.red { color: var(--color-negative); }
  .sub-val.gray { color: var(--stat-label-color); font-weight: 400; }

  .circle-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
  }
  .circle-icon.gold { background-color: #fef9c3; }
  .circle-icon.green { background-color: #dcfce7; }

  /* Separator spacing */
  :global(.my-separator) {
    margin-top: 0 !important;
    margin-bottom: var(--spacing-lg) !important;
  }

  .ranking-container {
    background: var(--color-bg-1);
    border-radius: var(--card-border-radius);
    border: 1px solid var(--color-border);
    box-shadow: var(--card-shadow);
    overflow: hidden;
  }

  .ranking-controls {
    padding: 1.25rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
  }

  .ranking-controls h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }

  .control-right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .search-box {
    position: relative;
    width: 15rem;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: var(--color-text-gray);
  }

  .search-box input {
    width: 100%;
    padding: 0.625rem 0.625rem 0.625rem 2.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    box-sizing: border-box;
    outline: none;
    background: var(--color-bg-1);
    color: var(--color-text);
  }
  .search-box input:focus { border-color: var(--color-theme-1); }
  .search-box input::placeholder { color: var(--color-text-gray); }

  /* Button override for filter */
  :global(.filter-btn-override) {
    display: flex !important;
    align-items: center !important;
    gap: 0.375rem !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    color: var(--color-text-gray) !important;
  }
  :global(.filter-btn-override svg) {
    width: 1rem;
    height: 1rem;
  }

  .ranking-table {
    width: 100%;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 80px 3fr 1.5fr 1.5fr 1.5fr;
    align-items: center;
    padding: 0 1.5rem;
  }

  .table-header {
    background-color: var(--color-bg-2);
    height: 3rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-gray);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .table-row {
    height: 5rem;
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background-color: var(--color-bg-2); }
  .table-row.my-rank { background-color: #eff6ff; }

  .empty-row {
    padding: 2.5rem;
    text-align: center;
    color: var(--color-text-gray);
    font-size: 0.875rem;
  }

  .col-rank {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .rank-circle {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
  }
  .rank-1 { background-color: #fef9c3; color: #b45309; }
  .rank-2 { background-color: #e5e7eb; color: #4b5563; }
  .rank-3 { background-color: #ffedd5; color: #c2410c; }
  .rank-default { background-color: transparent; color: var(--color-text); font-size: 1rem; }

  .rank-change {
    font-size: 0.6875rem;
    font-weight: 700;
  }
  .rank-change.up { color: #22c55e; }
  .rank-change.down { color: #ef4444; }
  .rank-change.neutral { color: var(--color-text-gray); }

  .col-player { padding-right: 1rem; }
  .flex-align { display: flex; align-items: center; gap: 0.75rem; }

  .avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: #e0f2fe;
    object-fit: cover;
  }

  .player-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .p-name {
    font-weight: 700;
    font-size: 0.9375rem;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .p-level { font-size: 0.75rem; color: var(--color-text-gray); }

  .col-assets { color: var(--color-text); font-size: 0.9375rem; }
  .col-return { font-size: 0.9375rem; }

  .font-bold { font-weight: 700; }
  .text-green { color: #22c55e; }
  .text-red { color: #ef4444; }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .ranking-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    .control-right { width: 100%; }
    .search-box { flex: 1; width: auto; }

    .ranking-table {
      min-width: 37.5rem;
    }
    .ranking-container {
      overflow-x: auto;
    }
  }
</style>
