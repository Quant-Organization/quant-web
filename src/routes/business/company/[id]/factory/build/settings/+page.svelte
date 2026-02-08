<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // --- Types ---
  interface OptionItem {
    id: string;
    label: string;
    desc: string;
    effect: string;
    costValue: number;
  }

  interface CategoryOption {
    id: string;
    title: string;
    costText: string;
    effectText: string;
    costValue: number;
  }

  // --- Data ---

  // 1. 공장 기본 정보
  const factoryInfo = {
    name: "기가 팩토리",
    region: "대구광역시",
    baseCost: 2.0,
    bonus: "건설 속도 +5%"
  };

  // 2. 생산 라인 옵션
  const productionLines: CategoryOption[] = [
    { id: 'general', title: '일반 생산 라인', costText: '+5B 건설비', effectText: '+0% 처리율', costValue: 5.0 },
    { id: 'auto', title: '자동 생산 라인', costText: '+8B 건설비', effectText: '+5% 처리율', costValue: 8.0 },
    { id: 'advanced', title: '첨단 생산 라인', costText: '+12B 건설비', effectText: '+10% 처리율', costValue: 12.0 }
  ];

  // 3. 시설 규모 옵션
  const facilityOptions = {
    land: [
      { id: 'l1', label: '1단계', desc: '+1B 건설비', effect: '+5% 생산량', costValue: 1.0 },
      { id: 'l2', label: '2단계', desc: '+3B 건설비', effect: '+10% 생산량', costValue: 3.0 }
    ],
    building: [
      { id: 'b1', label: '1단계', desc: '+2B 건설비', effect: '+5% 생산량', costValue: 2.0 },
      { id: 'b2', label: '2단계', desc: '+5B 건설비', effect: '+10% 생산량', costValue: 5.0 }
    ],
    rest: [
      { id: 'r1', label: '1단계', desc: '+1B 건설비', effect: '+5% 직원 수용량', costValue: 1.0 },
      { id: 'r2', label: '2단계', desc: '+3B 건설비', effect: '+10% 직원 수용량', costValue: 3.0 }
    ]
  };

  // 4. 에너지 효율 옵션
  const energyOptions: CategoryOption[] = [
    { id: 'std', title: '표준(기본)', costText: '+0B 건설비', effectText: '-0% 전기세', costValue: 0 },
    { id: 'high', title: '고효율 에너지', costText: '+1B 건설비', effectText: '-10% 전기세', costValue: 1.0 },
    { id: 'renew', title: '재생 에너지', costText: '+3B 건설비', effectText: '-20% 전기세', costValue: 3.0 }
  ];

  // 5. 보안 옵션
  const securityOptions: CategoryOption[] = [
    { id: 'std', title: '표준(기본)', costText: '+0B 건설비', effectText: '-0% 연구 실패율', costValue: 0 },
    { id: 'high', title: '고효율 보안', costText: '+0.8B 건설비', effectText: '-5% 연구 실패율', costValue: 0.8 },
    { id: 'ai', title: 'AI 보안 시스템', costText: '+2B 건설비', effectText: '-10% 연구 실패율', costValue: 2.0 }
  ];

  // --- State Management ---
  let selectedProdLine = $state(productionLines[1]);
  let selectedEnergy = $state(energyOptions[2]);
  let selectedSecurity = $state(securityOptions[2]);

  let selectedFacility = $state({
    land: facilityOptions.land[1],
    building: facilityOptions.building[1],
    rest: facilityOptions.rest[1]
  });

  // --- Derived Values ---
  let facilityCost = $derived(
    (selectedFacility.land?.costValue || 0) +
    (selectedFacility.building?.costValue || 0) +
    (selectedFacility.rest?.costValue || 0)
  );

  let totalCost = $derived(
    factoryInfo.baseCost +
    selectedProdLine.costValue +
    facilityCost +
    selectedEnergy.costValue +
    selectedSecurity.costValue
  );

  let costBreakdown = $derived({
    base: (factoryInfo.baseCost / totalCost) * 100,
    prod: (selectedProdLine.costValue / totalCost) * 100,
    facility: (facilityCost / totalCost) * 100,
    energy: (selectedEnergy.costValue / totalCost) * 100,
    security: (selectedSecurity.costValue / totalCost) * 100
  });

  const formatMoney = (val: number) => `${val % 1 === 0 ? val : val.toFixed(1)}B`;

  function goToNextStep() {
    goto(`/business/company/${$page.params.id}/factory/build/contract`);
  }
</script>

<svelte:head>
  <title>공장 건설 - 세부 설정</title>
</svelte:head>

<div class="page-container">

  <div class="page-title">
    <h2>공장 건설 - 2. 공장 세부 설정</h2>
  </div>

  <div class="stepper">
    <div class="step-item completed">
      <div class="step-icon check">✓</div>
      <span class="step-label">지역/등급 선택</span>
    </div>
    <div class="step-line active-line"></div>
    <div class="step-item active">
      <div class="step-icon check">✓</div>
      <span class="step-label">세부 설정</span>
    </div>
    <div class="step-line"></div>
    <div class="step-item inactive">
      <div class="step-icon custom-check">✓</div>
      <span class="step-label">견적 및 계약</span>
    </div>
  </div>

  <div class="content-wrapper">

    <div class="settings-column">

      <div class="card info-card">
        <div class="info-text">
          <h3>{factoryInfo.name}</h3>
          <div class="info-row">
            <span class="lbl">지역</span>
            <span class="val">{factoryInfo.region}</span>
          </div>
          <div class="info-row">
            <span class="lbl">기반 비용</span>
            <span class="val">{formatMoney(factoryInfo.baseCost)}</span>
          </div>
          <div class="info-row">
            <span class="lbl">지역 보너스</span>
            <span class="val text-bold">{factoryInfo.bonus}</span>
          </div>
        </div>
        <div class="info-img">
          <div class="img-placeholder">🏭 Factory Render</div>
        </div>
      </div>

      <div class="section">
        <h4>생산 라인 구성</h4>
        <div class="options-grid col-3">
          {#each productionLines as opt}
            <div
              class="option-card {selectedProdLine.id === opt.id ? 'selected' : ''}"
              onclick={() => selectedProdLine = opt}
              onkeydown={(e) => e.key === 'Enter' && (selectedProdLine = opt)}
              role="button" tabindex="0"
            >
              <div class="opt-title">{opt.title}</div>
              <div class="opt-cost {selectedProdLine.id === opt.id ? 'text-blue' : ''}">{opt.costText}</div>
              <div class="opt-effect">{opt.effectText}</div>
            </div>
          {/each}
        </div>
      </div>

      <div class="section">
        <h4>시설 규모</h4>
        <div class="options-grid col-3">
          <div class="sub-group">
            <span class="sub-label">부지 면적 확대</span>
            <div class="sub-options">
              {#each facilityOptions.land as opt}
                <button
                  class="mini-card {selectedFacility.land.id === opt.id ? 'selected' : ''}"
                  onclick={() => selectedFacility.land = opt}
                >
                  <div class="mini-head">{opt.label}</div>
                  <div class="mini-desc {selectedFacility.land.id === opt.id ? 'text-blue' : ''}">{opt.desc}</div>
                  <div class="mini-effect">{opt.effect}</div>
                </button>
              {/each}
            </div>
          </div>

          <div class="sub-group">
            <span class="sub-label">건축 면적 확대</span>
            <div class="sub-options">
              {#each facilityOptions.building as opt}
                <button
                  class="mini-card {selectedFacility.building.id === opt.id ? 'selected' : ''}"
                  onclick={() => selectedFacility.building = opt}
                >
                  <div class="mini-head">{opt.label}</div>
                  <div class="mini-desc {selectedFacility.building.id === opt.id ? 'text-blue' : ''}">{opt.desc}</div>
                  <div class="mini-effect">{opt.effect}</div>
                </button>
              {/each}
            </div>
          </div>

          <div class="sub-group">
            <span class="sub-label">직원 휴게실</span>
            <div class="sub-options">
              {#each facilityOptions.rest as opt}
                <button
                  class="mini-card {selectedFacility.rest.id === opt.id ? 'selected' : ''}"
                  onclick={() => selectedFacility.rest = opt}
                >
                  <div class="mini-head">{opt.label}</div>
                  <div class="mini-desc {selectedFacility.rest.id === opt.id ? 'text-blue' : ''}">{opt.desc}</div>
                  <div class="mini-effect">{opt.effect}</div>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h4>에너지 효율 옵션</h4>
        <div class="options-grid col-3">
          {#each energyOptions as opt}
            <div
              class="option-card checkbox-style {selectedEnergy.id === opt.id ? 'selected' : ''}"
              onclick={() => selectedEnergy = opt}
              onkeydown={(e) => e.key === 'Enter' && (selectedEnergy = opt)}
              role="button" tabindex="0"
            >
              <div class="chk-header">
                <div class="fake-checkbox {selectedEnergy.id === opt.id ? 'checked' : ''}"></div>
                <span class="opt-title-sm">{opt.title}</span>
              </div>
              <div class="chk-body">
                <div class="opt-cost {selectedEnergy.id === opt.id ? 'text-blue' : ''}">{opt.costText}</div>
                <div class="opt-effect">{opt.effectText}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="section">
        <h4>보안 옵션</h4>
        <div class="options-grid col-3">
          {#each securityOptions as opt}
            <div
              class="option-card checkbox-style {selectedSecurity.id === opt.id ? 'selected' : ''}"
              onclick={() => selectedSecurity = opt}
              onkeydown={(e) => e.key === 'Enter' && (selectedSecurity = opt)}
              role="button" tabindex="0"
            >
              <div class="chk-header">
                <div class="fake-checkbox {selectedSecurity.id === opt.id ? 'checked' : ''}"></div>
                <span class="opt-title-sm">{opt.title}</span>
              </div>
              <div class="chk-body">
                <div class="opt-cost {selectedSecurity.id === opt.id ? 'text-blue' : ''}">{opt.costText}</div>
                <div class="opt-effect">{opt.effectText}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

    </div>

    <div class="summary-column">
      <div class="summary-card">
        <h3>총 예상 견적</h3>

        <div class="summary-list">
          <div class="sum-row">
            <span>기반 비용</span>
            <span class="val">{formatMoney(factoryInfo.baseCost)}</span>
          </div>
          <div class="sum-row">
            <span>생산 라인</span>
            <span class="val">{formatMoney(selectedProdLine.costValue)}</span>
          </div>
          <div class="sum-row">
            <span>시설 규모</span>
            <span class="val">{formatMoney(facilityCost)}</span>
          </div>
          <div class="sum-row">
            <span>에너지 효율</span>
            <span class="val">{formatMoney(selectedEnergy.costValue)}</span>
          </div>
          <div class="sum-row">
            <span>보안 시스템</span>
            <span class="val">{formatMoney(selectedSecurity.costValue)}</span>
          </div>
        </div>

        <div class="divider-dashed"></div>

        <div class="total-row">
          <span>총계</span>
          <span class="total-val">{formatMoney(totalCost)}</span>
        </div>

        <div class="cost-bar">
          <div class="bar-seg bg-base" style="width: {costBreakdown.base}%"></div>
          <div class="bar-seg bg-prod" style="width: {costBreakdown.prod}%"></div>
          <div class="bar-seg bg-fac" style="width: {costBreakdown.facility}%"></div>
          <div class="bar-seg bg-eng" style="width: {costBreakdown.energy}%"></div>
          <div class="bar-seg bg-sec" style="width: {costBreakdown.security}%"></div>
        </div>

        <div class="date-row">
          <span class="lbl">예상 완공일</span>
          <span class="val">2026.05.17</span>
        </div>

        <button class="btn-next" onclick={goToNextStep}>다음단계로 ></button>
      </div>
    </div>

  </div>
</div>

<style>
  /* --- Base & Reset --- */
  * { box-sizing: border-box; }
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--color-text);
  }

  /* --- Header --- */
  .page-title h2 { font-size: 24px; font-weight: 700; margin: 0 0 32px 0; }

  /* --- Stepper --- */
  .stepper { display: flex; align-items: center; margin-bottom: 32px; }
  .step-item { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-text-gray); }
  .step-item.active { color: var(--color-text); }
  .step-item.completed { color: var(--color-theme-1); }

  .step-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: 12px; font-weight: 700; background-color: var(--color-border); color: white;
  }
  .step-item.active .step-icon, .step-item.completed .step-icon { background-color: var(--color-theme-1); }

  .step-line { flex: 1; height: 2px; background-color: var(--color-border); margin: 0 16px; }
  .step-line.active-line { background-color: var(--color-theme-1); }

  /* --- Layout --- */
  .content-wrapper {
    display: grid;
    grid-template-columns: 2.5fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* --- Left Column Components --- */
  .settings-column { display: flex; flex-direction: column; gap: 24px; }

  /* Info Card */
  .info-card {
    background: var(--color-bg-1); border: 1px solid var(--color-border); border-radius: 12px;
    padding: 24px; display: flex; justify-content: space-between;
  }
  .info-text h3 { font-size: 22px; margin: 0 0 16px 0; font-weight: 700; }
  .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
  .info-row .lbl { width: 100px; color: var(--color-text-gray); }
  .info-row .val { font-weight: 500; }
  .info-row .text-bold { font-weight: 700; }

  .info-img { width: 200px; height: 120px; border-radius: 8px; overflow: hidden; }
  .img-placeholder {
    width: 100%; height: 100%; background-color: var(--color-bg-2);
    display: flex; align-items: center; justify-content: center;
    color: var(--color-text-gray); font-size: 13px;
    background-image: url('https://img.freepik.com/free-photo/industrial-landscape-with-factory_23-2148130541.jpg?w=800');
    background-size: cover; background-position: center; color: transparent;
  }

  /* Section Styles */
  .section h4 { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; }

  .options-grid { display: grid; gap: 16px; }
  .options-grid.col-3 { grid-template-columns: repeat(3, 1fr); }

  /* General Option Card */
  .option-card {
    background: var(--color-bg-1); border: 2px solid var(--color-border); border-radius: 8px;
    padding: 20px; cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    display: flex; flex-direction: column; justify-content: center;
    min-height: 100px;
  }
  .option-card:hover { border-color: #93c5fd; }
  .option-card.selected {
    border-color: rgba(0, 82, 155, 0.8);
    background-color: rgba(66, 134, 245, 0.1);
    box-shadow:
      inset 0 5px 50px rgba(0, 82, 155, 0.2),
      0 4px 5px rgba(0, 0, 0, 0.05);
  }

  .opt-title { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
  .opt-cost { font-size: 13px; color: var(--color-text-gray); margin-bottom: 4px; font-weight: 500; }
  .opt-cost.text-blue { color: var(--color-theme-1); font-weight: 700; }
  .opt-effect { font-size: 12px; color: var(--color-text-gray); }

  /* Facility Sub-group Styling */
  .sub-group { display: flex; flex-direction: column; gap: 8px; }
  .sub-label { font-size: 14px; font-weight: 600; color: var(--color-text); }
  .sub-options { display: flex; gap: 8px; }

  .mini-card {
    flex: 1; text-align: left;
    background: var(--color-bg-1); border: 2px solid var(--color-border); border-radius: 6px;
    padding: 12px; cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    color: var(--color-text);
  }
  .mini-card:hover { border-color: #93c5fd; }
  .mini-card.selected {
    border-color: rgba(0, 82, 155, 0.8);
    background-color: rgba(66, 134, 245, 0.1);
    box-shadow:
      inset 0 5px 50px rgba(0, 82, 155, 0.2),
      0 4px 5px rgba(0, 0, 0, 0.05);
  }

  .mini-head { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
  .mini-desc { font-size: 11px; color: var(--color-text-gray); margin-bottom: 2px; }
  .mini-desc.text-blue { color: var(--color-theme-1); font-weight: 700; }
  .mini-effect { font-size: 11px; color: var(--color-text-gray); }

  /* Checkbox Style Cards (Energy/Security) */
  .checkbox-style {
    display: flex; flex-direction: column; justify-content: flex-start; gap: 12px;
  }
  .chk-header { display: flex; align-items: center; gap: 8px; }
  .fake-checkbox {
    width: 18px; height: 18px; border: 2px solid var(--color-border); border-radius: 4px;
    background: var(--color-bg-1);
  }
  .fake-checkbox.checked {
    background-color: var(--color-theme-1); border-color: var(--color-theme-1);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='14px' height='14px'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: center;
  }
  .opt-title-sm { font-weight: 600; font-size: 14px; }
  .chk-body { padding-left: 26px; }

  /* --- Right Column: Summary --- */
  .summary-column { position: sticky; top: 24px; }

  .summary-card {
    background: var(--color-bg-1); border: 1px solid var(--color-border); border-radius: 12px;
    padding: 24px;
  }
  .summary-card h3 { font-size: 18px; font-weight: 700; margin: 0 0 24px 0; }

  .summary-list { display: flex; flex-direction: column; gap: 12px; }
  .sum-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--color-text); }
  .sum-row .val { font-weight: 600; }

  .divider-dashed { border-top: 1px dashed var(--color-border); margin: 20px 0; }

  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .total-row span { font-weight: 700; font-size: 16px; }
  .total-row .total-val { font-size: 24px; color: var(--color-text); }

  /* Cost Bar */
  .cost-bar {
    display: flex; height: 12px; width: 100%; border-radius: 6px; overflow: hidden; margin-bottom: 24px;
    background-color: var(--color-bg-2);
  }
  .bar-seg { height: 100%; transition: width 0.3s ease; }
  .bg-base { background-color: #0f4c81; }
  .bg-prod { background-color: #2563eb; }
  .bg-fac { background-color: #10b981; }
  .bg-eng { background-color: #fbbf24; }
  .bg-sec { background-color: #ef4444; }

  .date-row {
    display: flex; justify-content: space-between; font-size: 13px; font-weight: 600;
    margin-bottom: 24px;
  }

  .btn-next {
    width: 100%; background-color: #0f4c81; color: white;
    border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 15px;
    cursor: pointer; transition: background 0.2s;
  }
  .btn-next:hover { background-color: #0c3b66; }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .content-wrapper { grid-template-columns: 1fr; }
    .summary-column { position: static; }
    .summary-card { margin-bottom: 24px; }
  }
  @media (max-width: 600px) {
    .options-grid.col-3 { grid-template-columns: 1fr; }
    .sub-options { flex-direction: column; }
  }
</style>
