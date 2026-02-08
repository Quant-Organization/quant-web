<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // --- Types ---
  interface FactoryType {
    id: string;
    name: string;
    description: string;
    production: string;
    employees: number;
    icon: string;
    isFullWidth?: boolean;
  }

  interface ConstructionSummary {
    region: string;
    grade: string;
    bonus: string;
    baseCost: string;
    maxRevenue: string;
    isPossible: boolean;
  }

  // --- Data ---

  // 공장 등급 데이터
  const factoryTypes: FactoryType[] = [
    {
      id: 'workshop',
      name: '공방',
      description: '초기 자본이 적을 때 적합한 소규모 생산 시설로, 수작업 중심의 한정된 생산을 수행합니다.',
      production: '40K',
      employees: 500,
      icon: '🏠'
    },
    {
      id: 'small',
      name: '소형 공장',
      description: '기본적인 설비를 갖춘 공장으로, 단순 자동화를 통해 안정적인 소량 생산이 가능합니다.',
      production: '100K',
      employees: 1700,
      icon: '🏭'
    },
    {
      id: 'medium',
      name: '중형 공장',
      description: '본격적인 대량 생산을 위한 표준적인 규모의 공장으로, 생산 효율과 품질 관리가 균형을 이룹니다.',
      production: '40K',
      employees: 500,
      icon: '🏭'
    },
    {
      id: 'large',
      name: '대형 공장',
      description: '대규모 설비와 다수의 생산 라인을 갖춘 공장으로, 낮은 단가의 대량 생산이 가능합니다.',
      production: '100K',
      employees: 1700,
      icon: '🏭'
    },
    {
      id: 'complex',
      name: '산업 단지',
      description: '여러 공장이 집약된 복합 생산 구역으로, 공정 분업과 물류 효율을 극대화합니다.',
      production: '40K',
      employees: 500,
      icon: '🏭'
    },
    {
      id: 'mega',
      name: '메가 팩토리',
      description: '고도화된 자동화 설비를 기반으로 초대량 생산을 수행하는 글로벌 공급망 핵심 시설입니다.',
      production: '100K',
      employees: 1700,
      icon: '🏭'
    },
    {
      id: 'giga',
      name: '기가 팩토리',
      description: '생산, 조립, 물류, 재활용까지 하나의 체계로 통합된 초대형 시설로, 압도적인 생산량과 효율을 바탕으로 국가 산업과 글로벌 시장에 큰 영향을 미칩니다.',
      production: '400B',
      employees: 170000,
      icon: '🏙️',
      isFullWidth: true
    }
  ];

  // 현재 선택된 상태 관리
  let selectedTypeId = $state('giga');
  let currentStep = $state(1);

  // 선택된 공장 정보
  let selectedFactory = $derived(factoryTypes.find(f => f.id === selectedTypeId));

  const summaryInfo: ConstructionSummary = {
    region: '대구광역시',
    grade: '기가 팩토리',
    bonus: '건설 속도 +5%',
    baseCost: '₩2B',
    maxRevenue: '₩30B',
    isPossible: true
  };

  function goToNextStep() {
    goto(`/business/company/${$page.params.id}/factory/build/settings`);
  }
</script>

<svelte:head>
  <title>공장 건설</title>
</svelte:head>

<div class="page-container">

  <div class="page-title">
    <h2>공장 건설 - 1. 지역/등급 선택</h2>
  </div>

  <div class="stepper">
    <div class="step-item active">
      <div class="step-icon check">✓</div>
      <span class="step-label">지역/등급 선택</span>
    </div>
    <div class="step-line"></div>
    <div class="step-item inactive">
      <div class="step-icon custom-check">✓</div>
      <span class="step-label">세부 설정</span>
    </div>
    <div class="step-line"></div>
    <div class="step-item inactive">
      <div class="step-icon custom-check">✓</div>
      <span class="step-label">견적 및 계약</span>
    </div>
  </div>

  <div class="content-wrapper">

    <div class="factory-grid">
      {#each factoryTypes as type}
        <div
          class="card factory-card {type.isFullWidth ? 'full-width' : ''}"
          class:selected={selectedTypeId === type.id}
          onclick={() => selectedTypeId = type.id}
          onkeydown={(e) => e.key === 'Enter' && (selectedTypeId = type.id)}
          role="button"
          tabindex="0"
        >
          <div class="card-header">
            <div class="icon-box">{type.icon}</div>
            <h3>{type.name}</h3>
          </div>
          <p class="desc">{type.description}</p>

          <div class="stats-row">
            <div class="stat">
              <span class="label">총 생산량/매달</span>
              <span class="val">{type.production}</span>
            </div>
            <div class="stat">
              <span class="label">직원 수</span>
              <span class="val">{type.employees.toLocaleString()}</span>
            </div>
          </div>

          <div class="stat-divider"></div>

          <div class="detail-link">
            ⓘ 상세 정보 보기 >
          </div>
        </div>
      {/each}
    </div>

    <div class="summary-panel">
      <div class="map-container">
        <div class="map-bg"></div>
        <div class="map-pin">
          <div class="pin-point"></div>
          <div class="pin-pulse"></div>
        </div>
        <div class="map-controls">
          <button>+</button>
          <button>-</button>
        </div>
      </div>

      <div class="summary-content">
        <div class="sum-row">
          <span class="lbl">선택 지역</span>
          <span class="val">{summaryInfo.region}</span>
        </div>
        <div class="sum-row">
          <span class="lbl">선택 등급</span>
          <span class="val highlight">{selectedFactory?.name}</span>
        </div>
        <div class="sum-row">
          <span class="lbl">지역 보너스</span>
          <span class="val text-green">{summaryInfo.bonus}</span>
        </div>

        <div class="divider-dashed"></div>

        <div class="sum-row cost-row">
          <span class="lbl">예상 기반 비용</span>
          <span class="val text-red">{summaryInfo.baseCost}</span>
        </div>
        <div class="sum-row cost-row">
          <span class="lbl">연간 최대 매출액</span>
          <span class="val text-blue">{summaryInfo.maxRevenue}</span>
        </div>
        <div class="sum-row cost-row">
          <span class="lbl">예상 건설 비용</span>
          <span class="badge-green">● 건설 가능</span>
        </div>

        <button class="btn-next" onclick={goToNextStep}>다음단계로 ></button>
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
  }

  /* --- Header --- */
  .page-title h2 {
    font-size: 24px; font-weight: 700; margin: 0 0 32px 0;
  }

  /* --- Stepper --- */
  .stepper {
    display: flex; align-items: center; margin-bottom: 32px;
  }
  .step-item {
    display: flex; align-items: center; gap: 8px;
    font-weight: 600; color: var(--color-text-gray);
  }
  .step-item.active { color: var(--color-text); }

  .step-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: 12px; font-weight: 700;
  }
  .step-item.active .step-icon { background-color: var(--color-theme-1); color: white; }
  .step-item.inactive .step-icon { background-color: var(--color-border); color: white; }

  .step-line {
    flex: 1; height: 2px; background-color: var(--color-border); margin: 0 16px;
  }

  /* --- Layout --- */
  .content-wrapper {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* --- Left: Factory Grid --- */
  .factory-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .factory-card {
    background: var(--color-bg-1);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    display: flex; flex-direction: column;
  }

  /* Full Width for Giga Factory */
  .factory-card.full-width {
    grid-column: span 2;
  }

  /* Selected State */
  .factory-card:hover { border-color: #93c5fd; }
  .factory-card.selected {
    border-color: rgba(0, 82, 155, 0.8);
    background-color: rgba(66, 134, 245, 0.1);
    box-shadow:
      inset 0 5px 50px rgba(0, 82, 155, 0.2),
      0 4px 5px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .icon-box { font-size: 24px; }
  .card-header h3 { font-size: 18px; font-weight: 700; margin: 0; }

  .desc {
    font-size: 13px; color: var(--color-text-gray); line-height: 1.5;
    margin: 0 0 20px 0; min-height: 40px;
  }

  .stats-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .stat .label { font-size: 12px; color: var(--color-text-gray); }
  .stat .val { font-size: 14px; font-weight: 700; color: var(--color-text); }

  .stat-divider {
    height: 1px;
    background-color: #D9D9D9;
    margin-bottom: 16px;
  }

  .detail-link {
    text-align: right; font-size: 12px; color: var(--color-theme-1); font-weight: 600;
    margin-top: auto;
  }

  /* --- Right: Map & Summary --- */
  .summary-panel {
    display: flex; flex-direction: column; gap: 16px;
  }

  /* Map */
  .map-container {
    height: 320px;
    background-color: var(--color-bg-2);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .map-bg {
    width: 100%; height: 100%;
    background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/South_Korea_location_map.svg/1200px-South_Korea_location_map.svg.png');
    background-size: cover;
    background-position: center;
    opacity: 0.8;
  }

  /* Map Pin */
  .map-pin {
    position: absolute;
    top: 60%; left: 70%;
    transform: translate(-50%, -100%);
  }
  .pin-point {
    width: 16px; height: 16px; background-color: #ef4444;
    border-radius: 50%; border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .pin-pulse {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 40px; height: 40px;
    background-color: rgba(239, 68, 68, 0.3);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
  }

  .map-controls {
    position: absolute; bottom: 12px; right: 12px;
    background: var(--color-bg-1); border-radius: 4px;
    display: flex; flex-direction: column;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .map-controls button {
    width: 32px; height: 32px; border: none; background: var(--color-bg-1);
    font-size: 18px; cursor: pointer; border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
  }

  /* Summary Content */
  .summary-content {
    background: var(--color-bg-1); padding: 24px;
    border-radius: 12px; border: 1px solid var(--color-border);
  }

  .sum-row {
    display: flex; justify-content: space-between; margin-bottom: 12px;
    font-size: 14px;
  }
  .sum-row .lbl { color: var(--color-text-gray); font-weight: 500; }
  .sum-row .val { font-weight: 700; color: var(--color-text); text-align: right; }
  .sum-row .val.highlight { font-size: 16px; }

  .sum-row .val.text-green { color: #13B981; }
  .sum-row .val.text-red { color: #EF4444; }
  .sum-row .val.text-blue { color: #00529B; }

  .divider-dashed {
    border-top: 1px dashed var(--color-border);
    margin: 16px 0;
  }

  .cost-row { align-items: center; margin-bottom: 16px; }
  .cost-row .val { font-size: 18px; }

  .badge-green {
    background-color: #dcfce7; color: #166534;
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
  }

  .btn-next {
    width: 100%;
    background-color: #0f4c81;
    color: white;
    padding: 16px;
    border: none; border-radius: 8px;
    font-size: 16px; font-weight: 700;
    cursor: pointer;
    margin-top: 8px;
    transition: background 0.2s;
  }
  .btn-next:hover { background-color: #0c3b66; }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .content-wrapper { grid-template-columns: 1fr; }
    .factory-grid { order: 2; }
    .summary-panel { order: 1; position: sticky; top: 0; z-index: 10; }
    .map-container { height: 200px; }
  }

  @media (max-width: 600px) {
    .factory-grid { grid-template-columns: 1fr; }
    .factory-card.full-width { grid-column: span 1; }
  }
</style>
