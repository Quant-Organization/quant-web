<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // --- Types ---
  interface RndEffect {
    id: string;
    name: string;
    level: number;
    description: string;
    icon: string;
  }

  // --- Data & State ---

  // 공장 기본 정보
  const factoryMeta = {
    name: "금성전자 1공장",
    region: "대한민국, 대구광역시",
    detail: "완공일: 2025.10.04 · 크기: 기가팩토리 · 면적: 2,000,000m²",
    type: "기가팩토리",
    initialEmployees: 12800,
    productionPerMonth: 900000, // 900K Units
    salesPerMonth: 800000, // 800K Units
    efficiency: "94%",
    quarterRevenue: "300K",
    completionDate: "2025.10.04",
    originalCost: 23000000000 // $23B 원가
  };

  // 인력 관리 상태
  let employeeCount = $state(12800);
  const minEmployees = 6400;
  const maxEmployees = 19200;
  const wagePerPerson = 3500;
  const productionPerPerson = 52;

  // 반응형 계산
  let totalLaborCost = $derived(employeeCount * wagePerPerson);
  let sliderPercent = $derived(((employeeCount - minEmployees) / (maxEmployees - minEmployees)) * 100);

  // 재고량 계산 (생산량 - 판매량)
  let inventory = $derived(factoryMeta.productionPerMonth - factoryMeta.salesPerMonth);

  // 매각 금액 (원가의 50%)
  let salePrice = $derived(factoryMeta.originalCost * 0.5);

  // R&D 효과 데이터
  const rndEffects: RndEffect[] = [
    { id: '1', name: '자동화 조립 라인', level: 3, description: '-12% 필요 인력', icon: '🤖' },
    { id: '2', name: '조립 라인 업그레이드', level: 3, description: '+12% 생산량', icon: '⚙️' },
    { id: '3', name: '물류창고 증설', level: 2, description: '+8% 창고 크기', icon: '📦' },
    { id: '4', name: '품질 관리 시스템', level: 1, description: '+4% 평균 효율', icon: '📋' },
  ];

  // 재무 상태 데이터
  const financials = {
    material: 2500000,
    electric: 1500000,
    revenue: 12000000,
    opex: -7000000
  };

  let totalOpex = $derived(totalLaborCost + financials.material + financials.electric);
  let netProfit = $derived(financials.revenue - totalOpex);

  // 숫자 포맷팅 유틸
  const fmtMoney = (n: number) => `${n.toLocaleString()}`;
  const fmtSimple = (n: number) => n.toLocaleString();
  const fmtUnit = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  // 공장 매각 핸들러
  function handleSellFactory() {
    const confirmed = confirm(`정말로 공장을 매각하시겠습니까?\n매각 금액: $${fmtMoney(salePrice)}`);
    if (confirmed) {
      alert(`공장이 $${fmtMoney(salePrice)}에 매각되었습니다.`);
      goto(`/business/company/${$page.params.id}/factory`);
    }
  }

  // 일시중지 핸들러
  function handlePauseFactory() {
    alert('공장 가동이 일시중지되었습니다.');
  }
</script>

<svelte:head>
  <title>{factoryMeta.name} - 상세 정보</title>
</svelte:head>

<div class="page-container">

  <div class="page-header">
    <div class="header-icon">🏭</div>
    <div class="header-text">
      <h1>{factoryMeta.name}</h1>
      <p class="sub-text">{factoryMeta.region}</p>
      <p class="meta-text">{factoryMeta.detail}</p>
    </div>
  </div>

  <div class="grid-layout">

    <div class="card location-card">
      <div class="map-section">
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
      <div class="summary-section">
        <div class="card-header">
          <h3>{factoryMeta.name} - 대구광역시</h3>
          <div class="tags">
            <span class="tag">반도체</span>
            <span class="tag">기가팩토리</span>
            <span class="tag">대구광역시</span>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="lbl">🏭 공장 유형</span>
            <span class="val">{factoryMeta.type}</span>
          </div>
          <div class="info-row">
            <span class="lbl">👤 직원 수</span>
            <span class="val">{fmtSimple(employeeCount)}명</span>
          </div>
          <div class="info-row">
            <span class="lbl">📦 총 생산량/매달</span>
            <span class="val">{fmtUnit(factoryMeta.productionPerMonth)} Units</span>
          </div>
          <div class="info-row">
            <span class="lbl">⚡ 평균 효율</span>
            <span class="val">{factoryMeta.efficiency}</span>
          </div>
          <div class="info-row">
            <span class="lbl">💵 분기별 수익</span>
            <span class="val">{factoryMeta.quarterRevenue}</span>
          </div>
          <div class="info-row">
            <span class="lbl">📅 완공일</span>
            <span class="val">{factoryMeta.completionDate}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <h3>공장 현황</h3>
      <div class="chart-stats">
        <div class="stat-item">
          <span class="s-lbl">총 생산량/매달</span>
          <span class="s-val">{fmtUnit(factoryMeta.productionPerMonth)}</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">평균 효율</span>
          <span class="s-val text-green">91.2%</span>
          <span class="s-sub">(R&D Bonus Incl.)</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">총 판매량/매달</span>
          <span class="s-val">{fmtUnit(factoryMeta.salesPerMonth)}</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">총 재고량</span>
          <span class="s-val">{fmtUnit(inventory)}</span>
        </div>
      </div>

      <div class="chart-container">
        <svg viewBox="0 0 400 120" class="line-chart">
          <line x1="0" y1="20" x2="400" y2="20" stroke="var(--color-border)" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="var(--color-border)" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="var(--color-border)" />

          <polyline
            points="10,90 60,80 110,95 160,70 210,65 260,50 310,55 360,40"
            fill="none" stroke="var(--color-theme-1)" stroke-width="2"
          />
          <polyline
            points="10,100 60,95 110,100 160,90 210,85 260,75 310,80 360,60"
            fill="none" stroke="#fbbf24" stroke-width="2"
          />
        </svg>
        <div class="chart-labels">
          <span>2025년 3월</span><span>4월</span><span>5월</span><span>6월</span><span>7월</span><span>8월</span>
        </div>
        <div class="legend">
          <span class="dot blue"></span> 생산량
          <span class="dot yellow"></span> 매출액
        </div>
      </div>
    </div>

    <div class="card control-card">
      <h3>인력 관리</h3>
      <p class="card-desc">직원 수를 조절하여 생산량과 인건비를 관리하세요.</p>

      <div class="slider-wrapper">
        <div class="slider-labels">
          <span>{fmtSimple(minEmployees)}명</span>
          <span>{fmtSimple(maxEmployees)}명</span>
        </div>
        <input
          type="range"
          min={minEmployees}
          max={maxEmployees}
          step="100"
          bind:value={employeeCount}
          style="background: linear-gradient(to right, #0f4c81 0%, #0f4c81 {sliderPercent}%, var(--color-border) {sliderPercent}%, var(--color-border) 100%);"
        />
      </div>

      <div class="stats-grid">
        <div class="s-box">
          <span class="l">생산성/인당</span>
          <span class="v">{productionPerPerson} <span class="unit">Units/월</span></span>
        </div>
        <div class="s-box">
          <span class="l">평균 임금</span>
          <span class="v">$3,500 <span class="unit">/월</span></span>
        </div>
        <div class="s-box">
          <span class="l">총 인건비</span>
          <span class="v large">${(totalLaborCost/1000000).toFixed(1)}M <span class="unit">단위/월</span></span>
        </div>
      </div>
    </div>

    <div class="card rnd-card">
      <h3>적용된 R&D 효과</h3>
      <div class="rnd-list">
        {#each rndEffects as effect}
          <div class="rnd-item">
            <div class="rnd-icon">{effect.icon}</div>
            <div class="rnd-info">
              <div class="rnd-head">
                <span class="rnd-name">{effect.name} Lv.{effect.level}</span>
              </div>
              <div class="rnd-desc text-green">{effect.description}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="card finance-container">
      <div class="finance-card">
        <h3>재무 상태</h3>
        <div class="finance-row">

          <div class="f-col">
            <h4>월 운영비 상세</h4>
            <div class="f-item">
              <span>인건비</span> <span>{fmtMoney(totalLaborCost)}</span>
            </div>
            <div class="f-item">
              <span>자재비</span> <span>{fmtMoney(financials.material)}</span>
            </div>
            <div class="f-item">
              <span>전기세</span> <span>{fmtMoney(financials.electric)}</span>
            </div>
            <div class="f-divider"></div>
            <div class="f-item total">
              <span>총계</span> <span class="text-red">-{fmtMoney(totalOpex)}</span>
            </div>
          </div>

          <div class="f-col">
            <h4>수익성 지표</h4>
            <div class="f-item">
              <span>월 매출</span> <span>{fmtMoney(financials.revenue)}</span>
            </div>
            <div class="f-item">
              <span>운영비</span> <span class="text-red">-{fmtMoney(totalOpex)}</span>
            </div>
            <div class="f-divider"></div>
            <div class="f-item total">
              <span>월 순수익</span> <span class="text-profit">{netProfit >= 0 ? '+' : ''}{fmtMoney(netProfit)}</span>
            </div>
          </div>

        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-yellow" onclick={handlePauseFactory}>일시중지</button>
        <button class="btn btn-red" onclick={handleSellFactory}>공장 매각</button>
      </div>
    </div>

  </div>
</div>

<style>
  /* --- Base --- */
  * { box-sizing: border-box; }
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--color-text);
  }

  /* --- Header --- */
  .page-header { display: flex; gap: 16px; margin-bottom: 24px; }
  .header-icon {
    width: 64px; height: 64px; background: var(--color-bg-2); border-radius: 8px;
    font-size: 32px; display: flex; align-items: center; justify-content: center;
  }
  .header-text h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; }
  .sub-text { margin: 0 0 4px 0; font-size: 14px; color: var(--color-text-gray); }
  .meta-text { margin: 0; font-size: 13px; color: var(--color-text-gray); }

  /* --- Grid Layout --- */
  .grid-layout {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 20px;
  }

  .card {
    background: var(--color-bg-1); border: 1px solid var(--color-border); border-radius: 12px;
    padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .card h3 { font-size: 18px; font-weight: 700; margin: 0 0 20px 0; }

  /* --- Location Card (Map + Summary Combined) --- */
  .location-card {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
    padding: 24px;
  }
  .map-section {
    height: 320px;
    background-color: var(--color-bg-2);
    border-radius: 12px;
    overflow: hidden;
  }
  .map-section iframe {
    width: 100%;
    height: 100%;
  }
  .summary-section {
    display: flex;
    flex-direction: column;
  }
  .summary-section .card-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
  .tags { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .tag {
    background: #F3F4F6;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    color: var(--color-text-gray);
    font-weight: 600;
    border: 1px solid #E3E9F1;
  }
  .info-list { display: flex; flex-direction: column; gap: 0; }
  .info-row {
    display: flex; justify-content: space-between; font-size: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .info-row:last-child { border-bottom: none; }
  .info-row .lbl { color: var(--color-text-gray); font-weight: 500; display: flex; align-items: center; gap: 6px; }
  .info-row .val { font-weight: 600; color: var(--color-text); }

  /* --- Chart Card --- */
  .chart-stats { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .stat-item { display: flex; flex-direction: column; }
  .s-lbl { font-size: var(--stat-label-size); color: var(--stat-label-color); margin-bottom: 0.5rem; }
  .s-val { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }
  .s-sub { font-size: 10px; color: var(--color-text-gray); font-weight: normal; }

  .chart-container { position: relative; margin-top: 16px; }
  .line-chart { width: 100%; height: 120px; overflow: visible; }
  .chart-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-gray); margin-top: 8px; }
  .legend { display: flex; justify-content: flex-end; gap: 12px; font-size: 11px; color: var(--color-text-gray); margin-top: 8px; }
  .dot { width: 8px; height: 8px; display: inline-block; border-radius: 50%; margin-right: 4px; }
  .dot.blue { background: var(--color-theme-1); }
  .dot.yellow { background: #fbbf24; }
  .text-green { color: #10b981; }

  /* --- Control Card (Slider) --- */
  .card-desc { font-size: 13px; color: var(--color-text-gray); margin-bottom: 16px; margin-top: -12px; }
  .slider-wrapper { position: relative; padding: 8px 0; margin-bottom: 24px; }
  .slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-gray); margin-bottom: 8px; }

  input[type=range] {
    width: 100%; -webkit-appearance: none; height: 6px; border-radius: 3px; outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #0f4c81; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .stats-grid { display: flex; justify-content: space-between; }
  .s-box { display: flex; flex-direction: column; }
  .s-box .l { font-size: 12px; color: var(--color-text-gray); margin-bottom: 4px; }
  .s-box .v { font-size: 16px; font-weight: 700; color: var(--color-text); }
  .s-box .v.large { font-size: 18px; }
  .unit { font-size: 11px; color: var(--color-text-gray); font-weight: normal; }

  /* --- R&D Card --- */
  .rnd-list { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .rnd-item { display: flex; align-items: center; gap: 12px; }
  .rnd-icon {
    width: 40px; height: 40px; background: #f0fdf4; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .rnd-info { flex: 1; }
  .rnd-head { margin-bottom: 2px; }
  .rnd-name { font-size: 14px; font-weight: 600; }
  .rnd-desc { font-size: 12px; font-weight: 600; }

  /* --- Finance & Actions --- */
  .finance-container {
    background: transparent; border: none; padding: 0; box-shadow: none;
    display: flex; flex-direction: column; gap: 20px;
  }
  .finance-card {
    background: var(--color-bg-1); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px;
  }
  .finance-row { display: flex; gap: 32px; }
  .f-col { flex: 1; }
  .f-col h4 { font-size: 14px; color: var(--color-text); margin: 0 0 16px 0; font-weight: 600; }
  .f-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: var(--color-text-gray); }
  .f-item span:last-child { font-weight: 600; color: var(--color-text); font-family: "Roboto", sans-serif; }

  .f-divider { border-top: 1px dashed var(--color-border); margin: 12px 0; }
  .f-item.total span:last-child { font-size: 15px; font-weight: 700; }

  .text-red { color: #ef4444 !important; }
  .text-profit { color: #13B981 !important; }

  /* Sale Info */
  .sale-info {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--color-bg-2); padding: 16px 20px; border-radius: 8px;
  }
  .sale-label { font-size: 14px; color: var(--color-text-gray); }
  .sale-value { font-size: 18px; font-weight: 700; color: var(--color-text); }

  /* Buttons */
  .action-buttons { display: flex; gap: 16px; }
  .btn {
    flex: 1; padding: 14px; border: none; border-radius: 8px;
    font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s;
  }
  .btn-yellow { background-color: #fef3c7; color: #92400e; }
  .btn-yellow:hover { background-color: #fde68a; }
  .btn-red { background-color: #fee2e2; color: #991b1b; }
  .btn-red:hover { background-color: #fecaca; }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .grid-layout { grid-template-columns: 1fr; }
    .location-card { grid-template-columns: 1fr; }
    .map-section { height: 250px; }
    .summary-section { padding: 0; padding-top: 16px; }
  }
  @media (max-width: 600px) {
    .finance-row { flex-direction: column; gap: 24px; }
    .stats-grid { flex-direction: column; gap: 12px; }
  }
</style>
