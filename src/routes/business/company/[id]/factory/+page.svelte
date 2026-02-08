<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // --- Types ---
  interface SummaryStat {
    label: string;
    value: string;
    unit?: string;
    change: string;
  }

  interface FactoryDetail {
    id: number;
    name: string;
    location: string;
    tags: string[];
    type: string;
    employees: string;
    production: string;
    efficiency: number;
    revenue: string;
    completionDate: string;
  }

  interface FactoryCardData {
    id: number;
    name: string;
    location: string;
    production: string;
    employees: string;
    completionDate: string;
    revenue: string;
    efficiency: number;
  }

  // --- Data ---

  // 1. 상단 요약 지표
  const summaryStats: SummaryStat[] = [
    { label: "총 공장 수", value: "4", change: "+5.2%" },
    { label: "총 생산량/매달", value: "1.8M", unit: "Units", change: "+14%" },
    { label: "평균 효율", value: "91.2%", change: "+5%" }
  ];

  // 2. 지도 옆 선택된 공장 상세 정보
  const selectedFactory: FactoryDetail = {
    id: 1,
    name: "금성전자 1공장 - 대구광역시",
    location: "대구광역시",
    tags: ["반도체", "기가팩토리", "대구광역시"],
    type: "기가팩토리",
    employees: "12,800명",
    production: "900K Units",
    efficiency: 94,
    revenue: "300K",
    completionDate: "2025.10.04"
  };

  // 3. 하단 공장 목록 데이터
  const factoryList: FactoryCardData[] = [
    {
      id: 1,
      name: "금성전자 1공장",
      location: "대구광역시, 대한민국",
      production: "900K",
      employees: "12,800명",
      completionDate: "2025.10.04",
      revenue: "300K",
      efficiency: 94
    },
    {
      id: 2,
      name: "금성전자 2공장",
      location: "대구광역시, 대한민국",
      production: "400K",
      employees: "4,800명",
      completionDate: "2025.08.04",
      revenue: "100K",
      efficiency: 88
    }
  ];

  // 필터 버튼 목록
  const filters = ["모든 공장", "나라별 정렬", "높은 생산량 순 정렬", "높은 효율 순 정렬"];
  let activeFilter = "모든 공장";
</script>

<svelte:head>
  <title>공장 관리</title>
</svelte:head>

<div class="page-container">

  <header class="page-header">
    <h1>금성전자 공장건설 및 관리</h1>
  </header>

  <div class="stats-grid">
    {#each summaryStats as stat}
      <div class="card stat-card">
        <div class="stat-label">{stat.label}</div>
        <div class="stat-content">
          <span class="stat-value">
            {stat.value}
            {#if stat.unit}<span class="stat-unit">{stat.unit}</span>{/if}
          </span>
          <span class="stat-change text-green">{stat.change}</span>
        </div>
      </div>
    {/each}
  </div>

  <div class="card location-card">
    <div class="map-section-inner">
      <iframe
        src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=대구광역시,대한민국&zoom=12"
        width="100%"
        height="100%"
        style="border:0;"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="공장 위치"
      ></iframe>
    </div>

    <div class="detail-section">
      <div class="detail-header">
        <h2>{selectedFactory.name}</h2>
        <div class="tags">
          {#each selectedFactory.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      </div>

      <div class="info-table">
        <div class="info-row">
          <span class="label"><span class="icon">🏭</span> 공장 유형</span>
          <span class="val">{selectedFactory.type}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label"><span class="icon">👤</span> 직원 수</span>
          <span class="val">{selectedFactory.employees}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label"><span class="icon">📦</span> 총 생산량/매달</span>
          <span class="val">{selectedFactory.production}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label"><span class="icon">⚡</span> 평균 효율</span>
          <span class="val">{selectedFactory.efficiency}%</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label"><span class="icon">💵</span> 분기별 수익</span>
          <span class="val">{selectedFactory.revenue}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label"><span class="icon">📅</span> 완공일</span>
          <span class="val">{selectedFactory.completionDate}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="list-section">
    <div class="list-header">
      <div class="header-left">
        <h2>공장 목록</h2>
        <div class="filter-group">
          {#each filters as filter}
            <button
              class="filter-btn"
              class:active={activeFilter === filter}
              onclick={() => activeFilter = filter}
            >
              {filter}
            </button>
          {/each}
        </div>
      </div>
      <button class="btn-primary" onclick={() => goto(`/business/company/${$page.params.id}/factory/build`)}>+ 새로운 공장 건설</button>
    </div>

    <div class="factory-grid">
      {#each factoryList as factory}
        <div class="card factory-card">
          <div class="f-header">
            <div class="f-icon">🏭</div>
            <div>
              <h3>{factory.name}</h3>
              <p class="location-sub">🇰🇷 {factory.location}</p>
            </div>
          </div>

          <div class="f-stats">
            <div class="f-stat-item">
              <span class="lbl">총 생산량/매달</span>
              <span class="val">{factory.production}</span>
            </div>
            <div class="f-stat-item">
              <span class="lbl">직원 수</span>
              <span class="val">{factory.employees}</span>
            </div>
            <div class="f-stat-item">
              <span class="lbl">완공일</span>
              <span class="val">{factory.completionDate}</span>
            </div>
            <div class="f-stat-item">
              <span class="lbl">분기별 수익</span>
              <span class="val">{factory.revenue}</span>
            </div>
          </div>

          <div class="efficiency-area">
            <span class="lbl">평균 효율</span>
            <div class="progress-bg">
              <div class="progress-fill" style="width: {factory.efficiency}%;"></div>
            </div>
          </div>

          <div class="card-actions">
            <button onclick={() => goto(`/business/company/${$page.params.id}/factory/${factory.id}`)}>자세히보기</button>
            <div class="v-divider"></div>
            <button>생산량 조절</button>
            <div class="v-divider"></div>
            <button>업그레이드</button>
          </div>
        </div>
      {/each}
    </div>
  </div>

</div>

<style>
  /* --- Global & Utilities --- */
  * { box-sizing: border-box; }

  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
  }

  .text-green { color: #10b981; }

  /* Common Card */
  .card {
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  /* Page Header */
  .page-header { margin-bottom: 24px; }
  .page-header h1 { font-size: 26px; font-weight: 700; margin: 0; }

  /* --- 1. Top Stats --- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card { padding: var(--card-padding); }
  .stat-label { font-size: var(--stat-label-size); color: var(--stat-label-color); font-weight: 500; margin-bottom: 0.5rem; }
  .stat-content { display: flex; align-items: baseline; gap: 0.5rem; }
  .stat-value { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }
  .stat-unit { font-size: 1rem; font-weight: var(--stat-change-weight); margin-left: 4px; }
  .stat-change { font-size: var(--stat-change-size); font-weight: var(--stat-change-weight); }

  /* --- 2. Location Card (Map + Detail Combined) --- */
  .location-card {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
    padding: 24px;
  }

  .map-section-inner {
    height: 350px;
    background-color: var(--color-bg-2);
    border-radius: 12px;
    overflow: hidden;
  }
  .map-section-inner iframe {
    width: 100%;
    height: 100%;
  }

  /* Detail Section */
  .detail-section {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .detail-header { margin-bottom: 20px; }
  .detail-header h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px 0; }

  .tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-size: 12px;
    color: var(--color-text-gray);
    background-color: #F3F4F6;
    padding: 6px 14px;
    border-radius: 9999px;
    font-weight: 600;
    border: 1px solid #E3E9F1;
  }

  .info-table { display: flex; flex-direction: column; gap: 12px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
  .info-row .label { color: var(--color-text-gray); display: flex; align-items: center; gap: 8px; }
  .info-row .icon { font-size: 14px; width: 16px; text-align: center; }
  .info-row .val { font-weight: 600; color: var(--color-text); }
  .divider { height: 1px; background-color: var(--color-border); width: 100%; }

  /* --- 3. Factory List Section --- */
  .list-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px;
  }
  .header-left { display: flex; align-items: center; gap: 24px; }
  .header-left h2 { font-size: 20px; font-weight: 700; margin: 0; }

  .filter-group { display: flex; gap: 8px; }
  .filter-btn {
    background: var(--color-bg-2); border: none; padding: 8px 16px;
    border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--color-text-gray);
    cursor: pointer; transition: 0.2s;
  }
  .filter-btn.active { background-color: #dbeafe; color: #2563eb; }
  .filter-btn:hover { background-color: var(--color-border); }

  .btn-primary {
    background-color: var(--color-theme-1); color: white; border: none;
    padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;
    cursor: pointer;
  }
  .btn-primary:hover { opacity: 0.9; }

  /* Factory Grid */
  .factory-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
  }

  .factory-card { display: flex; flex-direction: column; overflow: hidden; }

  /* Factory Card Header */
  .f-header {
    padding: 24px 24px 16px 24px;
    display: flex; gap: 16px; align-items: flex-start;
  }
  .f-icon {
    width: 48px; height: 48px;
    display: flex; justify-content: center; align-items: center;
    font-size: 24px; background-color: var(--color-bg-2);
    border: 1px solid var(--color-border); border-radius: 8px;
  }
  .f-header h3 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
  .location-sub { font-size: 13px; color: var(--color-text-gray); margin: 0; }

  /* Factory Stats Grid */
  .f-stats {
    padding: 0 24px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px;
    margin-bottom: 20px;
  }
  .f-stat-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; }
  .f-stat-item .lbl { color: var(--color-text-gray); }
  .f-stat-item .val { font-weight: 600; color: var(--color-text); }

  /* Efficiency Bar */
  .efficiency-area { padding: 0 24px 16px 24px; }
  .efficiency-area .lbl { display: block; font-size: 13px; color: var(--color-text-gray); margin-bottom: 6px; font-weight: 500; }

  .progress-bg {
    width: 100%; height: 8px; background-color: var(--color-bg-2);
    border-radius: 4px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background-color: var(--color-theme-1);
    border-radius: 4px;
  }

  /* Card Actions */
  .card-actions {
    display: flex;
    margin: 0 24px 24px 24px;
    border-radius: 12px;
    background-color: var(--color-bg-2);
    overflow: hidden;
  }
  .card-actions button {
    flex: 1; border: none; background: transparent; padding: 16px;
    font-size: 13px; font-weight: 500; color: var(--color-text-gray); cursor: pointer;
    transition: background 0.2s;
  }
  .card-actions button:hover { background-color: var(--color-bg-1); color: var(--color-text); font-weight: 600; }
  .card-actions button:first-child { border-radius: 12px 0 0 12px; }
  .card-actions button:last-of-type { border-radius: 0 12px 12px 0; }

  .v-divider { width: 1px; background-color: #000000; margin: 12px 0; }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: 1fr; }
    .location-card { grid-template-columns: 1fr; }
    .map-section-inner { height: 250px; }
    .factory-grid { grid-template-columns: 1fr; }
    .list-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .filter-group { overflow-x: auto; max-width: 100%; padding-bottom: 4px; }
  }
</style>
