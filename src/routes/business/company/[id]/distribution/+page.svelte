<script lang="ts">
  // ------------------------------------------
  // 1. 데이터 타입 정의 (TypeScript)
  // ------------------------------------------
  interface TopStat {
    title: string;
    value: string;
    unit?: string;
  }

  interface CountryInfo {
    country: string;
    flag: string;
    code: string;
    cost: string;
    tariff: string;
    time: string;
  }

  interface Competitor {
    rank: number;
    share: number; // 퍼센트
  }

  // ------------------------------------------
  // 2. 목업 데이터 (Mock Data)
  // ------------------------------------------

  const topStats: TopStat[] = [
    { title: "현재 총 재고", value: "3.12M", unit: "units" },
    { title: "월간 총 수출액", value: "$4.2M" },
    { title: "총 연구원 수", value: "120명" }
  ];

  const exportTableData: CountryInfo[] = [
    { country: "미국", flag: "🇺🇸", code: "US", cost: "$2,000", tariff: "0~5%", time: "14~21일" },
    { country: "유럽", flag: "🇪🇺", code: "EU", cost: "$3,000", tariff: "0~10%", time: "14~21일" },
    { country: "중국", flag: "🇨🇳", code: "CN", cost: "$1,500", tariff: "0~5%", time: "3~7일" },
    { country: "일본", flag: "🇯🇵", code: "JP", cost: "$1,000", tariff: "0~5%", time: "2~5일" },
    { country: "동남아", flag: "🌏", code: "SEA", cost: "$500", tariff: "0~15%", time: "7~14일" },
    { country: "인도", flag: "🇮🇳", code: "IN", cost: "$500", tariff: "0~15%", time: "10~16일" }
  ];

  // 선택된 국가 상태
  let selectedCountryCode = $state(exportTableData[0].code);
  let selectedCountry = $derived(exportTableData.find(c => c.code === selectedCountryCode) || exportTableData[0]);

  // 하단 디테일 데이터
  const marketOverview = {
    totalSize: "$ 180M units",
    availableSize: "$ 135M units",
    sharePercent: 75
  };

  const myStatus = {
    score: 85,
    share: "0.5%",
    cap: "3.12M units",
    currentSales: "1M units/월",
    shippingCost: "100K/월"
  };

  const inventoryStatus = {
    us: { current: 140, max: 180, unit: "units" },
    internal: { current: 8, max: 10, unit: "units" }
  };

  const competitors: Competitor[] = [
    { rank: 1, share: 35.0 },
    { rank: 2, share: 20.0 },
    { rank: 3, share: 18.0 },
    { rank: 4, share: 14.0 },
    { rank: 5, share: 10.0 }
  ];

  // 헬퍼: 퍼센트 계산
  const getPercent = (cur: number, max: number) => (cur / max) * 100;

  // 도넛 차트 SVG 계산
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (marketOverview.sharePercent / 100) * circumference;
</script>

<div class="page-wrapper">

  <header class="page-header">
    <h1>유통 및 판매</h1>
    <p>생산 된 제품의 글로벌 유통 및 판매를 관리합니다.</p>
  </header>

  <section class="top-stats-grid">
    {#each topStats as stat}
      <div class="card stat-card">
        <span class="label">{stat.title}</span>
        <div class="value-row">
          <h2 class="value">{stat.value}</h2>
          {#if stat.unit}<span class="unit">{stat.unit}</span>{/if}
        </div>
      </div>
    {/each}
  </section>

  <section class="card table-card">
    <h3>국가별 수출 정보</h3>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>국가</th>
            <th>물류비 (컨테이너당)</th>
            <th>관세율</th>
            <th>소모 시간</th>
          </tr>
        </thead>
        <tbody>
          {#each exportTableData as row}
            <tr>
              <td><span class="country-cell">{row.flag} {row.country}</span></td>
              <td class="font-bold">{row.cost}</td>
              <td>{row.tariff}</td>
              <td>{row.time}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="detail-section">
    <div class="country-selector">
      <div class="dropdown-wrapper">
        <select class="country-dropdown" bind:value={selectedCountryCode}>
          {#each exportTableData as country}
            <option value={country.code}>{country.flag} {country.country}</option>
          {/each}
        </select>
        <span class="dropdown-arrow">▾</span>
      </div>
      <div class="country-divider"></div>
    </div>

    <div class="detail-grid">

      <div class="card detail-card">
        <h4>시장 개요: {selectedCountry.country}</h4>
        <div class="chart-flex">
          <div class="chart-info">
            <div class="info-item">
              <span class="sub-label">총 시장 규모</span>
              <span class="sub-val">{marketOverview.totalSize}</span>
            </div>
            <div class="info-item">
              <span class="sub-label">가용 시장 규모</span>
              <span class="sub-val">{marketOverview.availableSize}</span>
            </div>
          </div>
          <div class="donut-wrapper">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                stroke-width="10"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="var(--color-theme-1)"
                stroke-width="10"
                stroke-dasharray={circumference}
                stroke-dashoffset={dashOffset}
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span class="donut-text">{marketOverview.sharePercent}%</span>
          </div>
        </div>
      </div>

      <div class="card detail-card">
        <h4>나의 현황</h4>

        <div class="score-row">
          <span class="sub-label">경쟁력 점수</span>
          <div class="score-bar-group">
            <div class="progress-track sm">
              <div class="progress-fill green" style="width: {myStatus.score}%"></div>
            </div>
            <span class="score-text">{myStatus.score}/100</span>
          </div>
        </div>

        <div class="status-grid">
          <div>
            <span class="tiny-label">시장 점유율</span>
            <span class="tiny-val">{myStatus.share}</span>
          </div>
          <div>
            <span class="tiny-label">판매 가능량</span>
            <span class="tiny-val">{myStatus.cap}</span>
          </div>
          <div>
            <span class="tiny-label">현재 판매량</span>
            <span class="tiny-val">{myStatus.currentSales}</span>
          </div>
          <div>
            <span class="tiny-label">물류비</span>
            <span class="tiny-val">{myStatus.shippingCost}</span>
          </div>
        </div>
      </div>

      <div class="card detail-card">
        <h4>재고 현황</h4>

        <div class="inventory-item">
          <div class="inv-header">
            <span class="sub-label">{selectedCountry.country} 창고 재고</span>
            <span class="inv-val">{inventoryStatus.us.current}M / {inventoryStatus.us.max}M {inventoryStatus.us.unit}</span>
          </div>
          <div class="progress-track md">
            <div class="progress-fill green" style="width: {getPercent(inventoryStatus.us.current, inventoryStatus.us.max)}%"></div>
          </div>
        </div>

        <div class="inventory-item">
          <div class="inv-header">
            <span class="sub-label">현재 내 기업 재고</span>
            <span class="inv-val">{inventoryStatus.internal.current}M / {inventoryStatus.internal.max}M {inventoryStatus.internal.unit}</span>
          </div>
          <div class="progress-track md">
            <div class="progress-fill green" style="width: {getPercent(inventoryStatus.internal.current, inventoryStatus.internal.max)}%"></div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <section class="card competitor-card">
    <h4>경쟁사 현황 (중국 시장 점유율)</h4>
    <div class="competitor-list">
      {#each competitors as comp}
        <div class="comp-row">
          <span class="rank">{comp.rank}</span>
          <span class="comp-label">총 시장 규모</span>
          <div class="progress-track lg">
            <div class="progress-fill green" style="width: {comp.share}%"></div>
          </div>
          <span class="comp-val">{comp.share.toFixed(1)}%</span>
        </div>
      {/each}
    </div>
  </section>

</div>

<style>
  /* --- 기본 설정 --- */
  .page-wrapper {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--color-text);
  }

  .card {
    background: var(--color-bg-1);
    border-radius: 12px;
    border: 1px solid var(--color-border);
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }

  /* --- 1. 헤더 --- */
  .page-header { margin-bottom: 32px; }
  .page-header h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; }
  .page-header p { font-size: 16px; color: var(--color-text-gray); margin: 0; }

  /* --- 2. 상단 통계 --- */
  .top-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 24px;
  }

  .stat-card .label { font-size: var(--stat-label-size); color: var(--stat-label-color); display: block; margin-bottom: 0.5rem; font-weight: 500;}
  .value-row { display: flex; align-items: baseline; gap: 4px; }
  .stat-card .value { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); margin: 0; color: var(--color-text); }
  .stat-card .unit { font-size: 1.25rem; font-weight: var(--stat-change-weight); color: var(--stat-label-color); }

  /* --- 3. 테이블 --- */
  .table-card { margin-bottom: 32px; padding: 20px 24px; }
  .table-card h3 { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: var(--color-text); }

  .table-responsive { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 600px; }

  th { text-align: left; color: var(--color-text-gray); font-size: 13px; font-weight: 600; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
  td { font-size: 14px; padding: 16px 0; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
  tr:last-child td { border-bottom: none; }
  .font-bold { font-weight: 700; }
  .country-cell { display: flex; align-items: center; gap: 6px; }

  /* --- 4. 상세 그리드 섹션 --- */
  .detail-section { margin-bottom: 24px; }

  .country-selector { margin-bottom: 24px; }

  .dropdown-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }

  .country-dropdown {
    appearance: none;
    -webkit-appearance: none;
    background: none;
    border: none;
    font-size: 18px;
    font-weight: 700;
    color: var(--color-theme-1);
    cursor: pointer;
    padding-right: 20px;
    outline: none;
  }

  .country-dropdown option {
    color: var(--color-text);
    font-weight: 500;
  }

  .dropdown-arrow {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: var(--color-theme-1);
    pointer-events: none;
  }

  .country-divider {
    height: 1px;
    background-color: var(--color-border);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .detail-card h4 { font-size: 16px; font-weight: 700; margin: 0 0 20px 0; color: var(--color-text); }

  /* 4-1. 도넛 차트 */
  .chart-flex { display: flex; justify-content: space-between; align-items: center; }
  .info-item { margin-bottom: 12px; display: flex; flex-direction: column; }

  .sub-label { font-size: 13px; color: var(--color-text-gray); font-weight: 500; margin-bottom: 4px; }
  .sub-val { font-size: 15px; font-weight: 700; color: var(--color-text); }

  /* SVG Donut Chart */
  .donut-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .donut-wrapper svg {
    position: absolute;
    top: 0;
    left: 0;
  }
  .donut-text {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    z-index: 1;
  }

  /* 4-2. 나의 현황 */
  .score-row { margin-bottom: 24px; }
  .score-bar-group { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .score-text { font-size: 14px; font-weight: 700; min-width: 60px; text-align: right; color: #10b981; }

  .status-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px;
  }
  .tiny-label { font-size: 12px; color: var(--color-text-gray); display: block; margin-bottom: 2px; }
  .tiny-val { font-size: 14px; font-weight: 700; color: var(--color-text); }

  /* 4-3. 재고 현황 */
  .inventory-item { margin-bottom: 24px; }
  .inventory-item:last-child { margin-bottom: 0; }
  .inv-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .inv-val { font-size: 13px; font-weight: 700; color: var(--color-text); }

  /* 공통 프로그레스 바 */
  .progress-track {
    background-color: var(--color-bg-2); border-radius: 99px; overflow: hidden;
  }
  .progress-track.sm { height: 6px; flex: 1; }
  .progress-track.md { height: 8px; width: 100%; }
  .progress-track.lg { height: 12px; flex: 1; }

  .progress-fill { height: 100%; border-radius: 99px; }
  .progress-fill.green { background-color: #10b981; }

  /* --- 5. 경쟁사 현황 --- */
  .competitor-card h4 { font-size: 16px; font-weight: 700; margin: 0 0 20px 0; color: var(--color-text); }

  .comp-row {
    display: flex; align-items: center; gap: 16px; margin-bottom: 12px;
  }
  .comp-row:last-child { margin-bottom: 0; }

  .rank { width: 16px; font-size: 13px; color: var(--color-text-gray); }
  .comp-label { width: 80px; font-size: 13px; color: var(--color-text-gray); }
  .comp-val { width: 48px; text-align: right; font-size: 13px; font-weight: 600; color: var(--color-text); }

  /* 반응형 (Mobile) */
  @media (max-width: 900px) {
    .top-stats-grid { grid-template-columns: 1fr; }
    .detail-grid { grid-template-columns: 1fr; }
    .table-responsive { overflow-x: auto; }
  }
</style>
