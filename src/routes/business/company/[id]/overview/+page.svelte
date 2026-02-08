<script lang="ts">
  import { page } from '$app/stores';

  // --- Types ---
  interface StatMetric {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
  }

  interface ChartDataPoint {
    label: string;
    revenue: number;
    netIncome: number;
  }

  interface NewsItem {
    source: string;
    time: string;
    content: string;
  }

  // --- Data ---

  // 1. 상단 핵심 지표
  const stats: StatMetric[] = [
    { label: "총 자산", value: "$1.5M", change: "+5.2%", isPositive: true },
    { label: "분기별 수익", value: "$410K", change: "+14%", isPositive: true },
    { label: "총 생산량", value: "7.12M", change: "+5%", isPositive: true },
    { label: "고용 직원 수", value: "12,400", change: "+3.6%", isPositive: true }
  ];

  // 2. 기업 정보
  const companyInfo = {
    name: "금성전자",
    description: "금성전자는 대한민국의 반도체를 설계하는 기업으로 대구에 본사를 두고 있다.",
    ceo: "PlayerName",
    founded: "2025.10.15",
    hq: "대한민국 대구광역시"
  };

  // 3. 차트 데이터 (매출 추이)
  const MAX_VALUE = 400;
  const CHART_HEIGHT = 200;

  const chartData: ChartDataPoint[] = [
    { label: "2024년 6월", revenue: 290, netIncome: 90 },
    { label: "2024년 9월", revenue: 280, netIncome: 80 },
    { label: "2024년 12월", revenue: 300, netIncome: 60 },
    { label: "2025년 3월", revenue: 320, netIncome: 85 },
    { label: "2025년 6월", revenue: 350, netIncome: 90 },
    { label: "2025년 9월", revenue: 390, netIncome: 100 },
  ];

  // 4. 뉴스 데이터
  const newsList: NewsItem[] = [
    {
      source: "BBC",
      time: "2분전",
      content: "미 연준, 기준 금리 동결 시사... 시장은 안도 랠리"
    },
    {
      source: "MBS",
      time: "12분전",
      content: "반도체 기업의 핵심 부품인 니켈과 리튬의 가격이 각각 15% 20% 포인트 가까이 상승해 관련 업종에 큰 타격을 입힐것으로 예상됩니다."
    }
  ];

  let activeTab = "quarterly";
</script>

<svelte:head>
  <title>{companyInfo.name} - 기업 현황</title>
</svelte:head>

<div class="page-container">

  <header class="page-header">
    <h1>{companyInfo.name} 대시보드</h1>
    <p>기업의 핵심 성과와 거시 경제 지표를 종합적으로 분석하세요.</p>
  </header>

  <div class="stats-grid">
    {#each stats as stat}
      <div class="card stat-card">
        <div class="stat-label">{stat.label}</div>
        <div class="stat-row">
          <span class="stat-value">{stat.value}</span>
          <span class="stat-change {stat.isPositive ? 'text-green' : 'text-red'}">
            {stat.change}
          </span>
        </div>
      </div>
    {/each}
  </div>

  <div class="content-grid">

    <div class="card chart-card">
      <div class="chart-header">
        <h3>기업 매출 추이</h3>
      </div>

      <div class="tabs">
        <button class:active={activeTab === 'quarterly'} onclick={() => activeTab = 'quarterly'}>매분기</button>
        <button class:active={activeTab === 'yearly'} onclick={() => activeTab = 'yearly'}>연간</button>
      </div>

      <div class="chart-container">
        <svg viewBox="0 0 600 240" class="bar-chart">
          {#each [0, 1, 2, 3, 4] as tick}
            <line x1="0" y1={200 - (tick * 50)} x2="560" y2={200 - (tick * 50)} stroke="var(--color-border)" stroke-dasharray="0" />
            <text x="570" y={205 - (tick * 50)} font-size="10" fill="var(--color-text-gray)" text-anchor="start">
              {tick === 0 ? '0' : tick + '00K'}
            </text>
          {/each}

          {#each chartData as point, i}
            <g transform="translate({30 + i * 90}, 0)">
              <rect
                x="0"
                y={200 - (point.revenue / MAX_VALUE * 200)}
                width="16"
                height={point.revenue / MAX_VALUE * 200}
                fill="var(--color-theme-1)" rx="2"
              />
              <rect
                x="20"
                y={200 - (point.netIncome / MAX_VALUE * 200)}
                width="16"
                height={point.netIncome / MAX_VALUE * 200}
                fill="#fbbf24" rx="2"
              />

              <text x="18" y="225" font-size="10" fill="var(--color-theme-1)" text-anchor="middle">{point.label}</text>
            </g>
          {/each}
        </svg>

        <div class="chart-legend">
          <div class="legend-item"><span class="dot blue"></span>수익</div>
          <div class="legend-item"><span class="dot yellow"></span>순이익</div>
        </div>
      </div>
    </div>

    <div class="card info-card">
      <div class="info-header">
        <h3>{companyInfo.name}</h3>
        <p class="desc">{companyInfo.description}</p>
      </div>

      <div class="info-list">
        <div class="info-row">
          <span class="label icon-user">👤 CEO</span>
          <span class="val">{companyInfo.ceo}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label icon-cal">📅 설립</span>
          <span class="val">{companyInfo.founded}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="label icon-loc">📍 본사</span>
          <span class="val">{companyInfo.hq}</span>
        </div>
      </div>
    </div>

  </div>

  <div class="news-section">
    <h3>뉴스</h3>
    <div class="news-list">
      {#each newsList as news}
        <div class="news-item">
          <div class="news-meta">
            <span class="source">{news.source}</span>
            <span class="dot">•</span>
            <span class="time">{news.time}</span>
          </div>
          <div class="news-content">{news.content}</div>
        </div>
      {/each}
    </div>
  </div>

</div>

<style>
  /* --- Global & Layout --- */
  * { box-sizing: border-box; }

  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--color-text);
  }

  .page-header { margin-bottom: 24px; }
  .page-header h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px 0; }
  .page-header p { color: var(--color-text-gray); margin: 0; font-size: 15px; }

  /* Common Card Style */
  .card {
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  /* --- 1. Stats Grid --- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }

  .stat-label { font-size: var(--stat-label-size); color: var(--stat-label-color); font-weight: 500; margin-bottom: 0.5rem; }
  .stat-row { display: flex; align-items: baseline; gap: 0.5rem; }
  .stat-value { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }
  .stat-change { font-size: var(--stat-change-size); font-weight: var(--stat-change-weight); }

  .text-green { color: var(--stat-change-positive); }
  .text-red { color: var(--color-negative); }

  /* --- 2. Content Grid (Chart + Info) --- */
  .content-grid {
    display: grid;
    grid-template-columns: 2.8fr 1.2fr;
    gap: 24px;
    margin-bottom: 32px;
  }

  /* Chart Card */
  .chart-card { display: flex; flex-direction: column; min-height: 400px; }
  .chart-header h3 { font-size: 18px; font-weight: 700; color: var(--color-text); margin: 0 0 16px 0; }

  .tabs { margin-bottom: 24px; display: flex; gap: 16px; border-bottom: 1px solid var(--color-border); }
  .tabs button {
    background: none;
    border: none;
    padding: 8px 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-gray);
    cursor: pointer;
    position: relative;
  }
  .tabs button.active { color: var(--color-theme-1); }
  .tabs button.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; width: 100%; height: 2px;
    background-color: var(--color-theme-1);
  }

  .chart-container { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
  .bar-chart { width: 100%; height: auto; overflow: visible; }

  .chart-legend { display: flex; gap: 16px; margin-top: 4px; font-size: 12px; color: var(--color-text-gray); }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: block; }
  .dot.blue { background-color: var(--color-theme-1); }
  .dot.yellow { background-color: #fbbf24; }

  /* Info Card */
  .info-card { height: fit-content; }
  .info-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
  .info-header h3 { font-size: 20px; margin: 0 0 8px 0; font-weight: 700; }
  .info-header .desc { font-size: 13px; color: var(--color-text-gray); line-height: 1.5; margin: 0; }

  .info-list { display: flex; flex-direction: column; gap: 12px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
  .info-row .label { color: var(--color-text-gray); display: flex; align-items: center; gap: 6px; }
  .info-row .val { font-weight: 600; color: var(--color-text); text-align: right; }
  .divider { height: 1px; background-color: var(--color-border); width: 100%; }

  /* --- 3. News Section --- */
  .news-section h3 { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: var(--color-text); }
  .news-list { border-top: 1px solid var(--color-border); }

  .news-item { padding: 20px 0; border-bottom: 1px solid var(--color-border); }
  .news-meta { font-size: 12px; color: var(--color-text-gray); margin-bottom: 8px; font-weight: 500; }
  .news-content { font-size: 15px; color: var(--color-text); line-height: 1.5; }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .content-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
  }
</style>
