<script lang="ts">
  // ------------------------------------------
  // 1. 데이터 타입 정의 (TypeScript)
  // ------------------------------------------
  interface TopStat {
    label: string;
    mainValue: string;
    subValue?: string;
    subValueColor?: 'green' | 'red' | 'gray';
    iconType: 'medal' | 'crown' | 'chart';
  }

  interface Player {
    id: number;
    rank: number;
    rankChange: number;
    name: string;
    level: number;
    title: string;
    tag: string;
    assets: string;
    weeklyReturn: string;
    avatarUrl: string;
  }

  // ------------------------------------------
  // 2. 목업 데이터 (Mock Data)
  // ------------------------------------------

  const topStats: TopStat[] = [
    {
      label: "상위 1% 자산 평균",
      mainValue: "#1,204",
      subValue: "↑24위 상승",
      subValueColor: 'green',
      iconType: 'medal'
    },
    {
      label: "상위 1% 자산 평균",
      mainValue: "$42.8B",
      subValue: "(약 55조원)",
      subValueColor: 'gray',
      iconType: 'chart'
    },
    {
      label: "이번주 최고 수익률",
      mainValue: "+145.5%",
      subValue: "Player_7",
      subValueColor: 'gray',
      iconType: 'crown'
    }
  ];

  const players: Player[] = [
    {
      id: 1, rank: 1, rankChange: 3,
      name: "Allwayshapppy", level: 66, title: "Grand Master",
      tag: "무법자", assets: "$33.4B", weeklyReturn: "+12.4%",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    },
    {
      id: 2, rank: 2, rankChange: -1,
      name: "Good Day", level: 59, title: "Grand Master",
      tag: "싸이코", assets: "$33.4B", weeklyReturn: "-3.2%",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
    },
    {
      id: 3, rank: 3, rankChange: 0,
      name: "여기는 넘으면 안되에에에에에엠", level: 59, title: "Grand Master",
      tag: "챔피언", assets: "$33.4B", weeklyReturn: "+5.1%",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe"
    },
    {
      id: 4, rank: 4, rankChange: 3,
      name: "User_1", level: 59, title: "Grand Master",
      tag: "챔피언", assets: "$33.4B", weeklyReturn: "+5.1%",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack"
    },
    {
      id: 5, rank: 5, rankChange: 3,
      name: "User_2", level: 59, title: "Grand Master",
      tag: "챔피언", assets: "$33.4B", weeklyReturn: "+5.1%",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack"
    },
    {
      id: 6, rank: 6, rankChange: 3,
      name: "User_3", level: 59, title: "Grand Master",
      tag: "챔피언", assets: "$33.4B", weeklyReturn: "+5.1%",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack"
    }
  ];

  // ------------------------------------------
  // 3. 헬퍼 함수
  // ------------------------------------------
  function getRankColorClass(rank: number) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-default';
  }

  function getTagStyle(tag: string) {
    switch (tag) {
      case '무법자': return 'tag-red';
      case '싸이코': return 'tag-black';
      case '챔피언': return 'tag-black';
      default: return 'tag-default';
    }
  }
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

  <section class="stats-grid">
    {#each topStats as stat}
      <div class="stat-card">
        <div class="stat-content">
          <span class="stat-label">{stat.label}</span>
          <div class="stat-values">
            <span class="main-val">{stat.mainValue}</span>
            {#if stat.subValue}
              <span class="sub-val {stat.subValueColor}">{stat.subValue}</span>
            {/if}
          </div>
        </div>
        <div class="stat-icon">
          {#if stat.iconType === 'medal'}
            <div class="circle-icon gold">🥇</div>
          {:else if stat.iconType === 'crown'}
            <div class="circle-icon green">👑</div>
          {/if}
        </div>
      </div>
    {/each}
  </section>

  <section class="ranking-container">

    <div class="ranking-controls">
      <h2>실시간 랭킹</h2>
      <div class="control-right">
        <div class="search-box">
          <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="플레이어 검색" />
        </div>
        <button class="filter-btn">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          필터
        </button>
      </div>
    </div>

    <div class="ranking-table">
      <div class="table-header">
        <div class="col-rank">순위</div>
        <div class="col-player">플레이어</div>
        <div class="col-tag">투자 성향</div>
        <div class="col-assets">총 자산 가치</div>
        <div class="col-return">주간 수익률</div>
      </div>

      <div class="table-body">
        {#each players as player}
          <div class="table-row">

            <div class="col-rank">
              <div class="rank-circle {getRankColorClass(player.rank)}">
                {player.rank}
              </div>
              <div class="rank-change {player.rankChange >= 0 ? 'up' : 'down'}">
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
              <img src={player.avatarUrl} alt="avatar" class="avatar" />
              <div class="player-info">
                <span class="p-name">{player.name}</span>
                <span class="p-level">Level {player.level} · {player.title}</span>
              </div>
            </div>

            <div class="col-tag">
              <span class="badge {getTagStyle(player.tag)}">{player.tag}</span>
            </div>

            <div class="col-assets font-bold">
              {player.assets}
            </div>

            <div class="col-return font-bold {player.weeklyReturn.startsWith('+') ? 'text-green' : 'text-red'}">
              {player.weeklyReturn}
            </div>

          </div>
        {/each}
      </div>
    </div>
  </section>
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .stat-card {
    background: var(--color-bg-1);
    border-radius: var(--card-border-radius);
    padding: var(--card-padding);
    border: 1px solid var(--color-border);
    box-shadow: var(--card-shadow);
    display: flex;
    justify-content: space-between;
    align-items: center;
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
  .sub-val.gray { color: var(--stat-label-color); font-weight: 400; }

  .circle-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
  }
  .circle-icon.gold { background-color: #fef9c3; }
  .circle-icon.green { background-color: #dcfce7; }

  .ranking-container {
    background: var(--color-bg-1);
    border-radius: var(--card-border-radius);
    border: 1px solid var(--color-border);
    box-shadow: var(--card-shadow);
    overflow: hidden;
  }

  .ranking-controls {
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
  }

  .ranking-controls h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }

  .control-right {
    display: flex;
    gap: 12px;
  }

  .search-box {
    position: relative;
    width: 240px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--color-text-gray);
  }

  .search-box input {
    width: 100%;
    padding: 10px 10px 10px 36px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
    background: var(--color-bg-1);
    color: var(--color-text);
  }
  .search-box input:focus { border-color: var(--color-theme-1); }
  .search-box input::placeholder { color: var(--color-text-gray); }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-bg-2);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-gray);
    cursor: pointer;
  }
  .filter-btn svg { width: 16px; height: 16px; }

  .ranking-table {
    width: 100%;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 80px 3fr 1.5fr 1.5fr 1.5fr;
    align-items: center;
    padding: 0 24px;
  }

  .table-header {
    background-color: var(--color-bg-2);
    height: 48px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-gray);
    font-size: 13px;
    font-weight: 600;
  }

  .table-row {
    height: 80px;
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background-color: var(--color-bg-2); }

  .col-rank {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .rank-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
  }
  .rank-1 { background-color: #fef9c3; color: #b45309; }
  .rank-2 { background-color: #e5e7eb; color: #4b5563; }
  .rank-3 { background-color: #ffedd5; color: #c2410c; }
  .rank-default { background-color: transparent; color: var(--color-text); font-size: 16px; }

  .rank-change {
    font-size: 11px;
    font-weight: 700;
  }
  .rank-change.up { color: #22c55e; }
  .rank-change.down { color: #ef4444; }

  .col-player { padding-right: 16px; }
  .flex-align { display: flex; align-items: center; gap: 12px; }

  .avatar {
    width: 48px;
    height: 48px;
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
    font-size: 15px;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .p-level { font-size: 12px; color: var(--color-text-gray); }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .tag-red { background-color: #fee2e2; color: #991b1b; }
  .tag-black { border: 1px solid var(--color-text); color: var(--color-text); background: var(--color-bg-1); }
  .tag-default { background: var(--color-bg-2); color: var(--color-text-gray); }

  .col-assets { color: var(--color-text); font-size: 15px; }
  .col-return { font-size: 15px; }

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
      gap: 16px;
    }
    .control-right { width: 100%; }
    .search-box { flex: 1; width: auto; }

    .ranking-table {
      min-width: 600px;
    }
    .ranking-container {
      overflow-x: auto;
    }
  }
</style>
