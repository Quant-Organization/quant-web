<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // --- Types ---
  interface ContractData {
    companyName: string;
    clientName: string;
    contractorName: string;
    startDate: string;
    endDate: string;
    totalAmount: string;
    breakdown: { label: string; value: string }[];
    signDate: string;
  }

  // --- Data ---
  const contractData: ContractData = {
    companyName: "금성 공장 건설 계획서",
    clientName: "PlayerName",
    contractorName: "Quant 건설",
    startDate: "2026년 01월 01일",
    endDate: "2027년 01월 01일",
    totalAmount: "$23,000,000,000 (USD)",
    breakdown: [
      { label: "기반 비용", value: "$2,000,000,000 (USD)" },
      { label: "생산 라인", value: "$5,000,000,000 (USD)" },
      { label: "시설 규모", value: "$11,000,000,000 (USD)" },
      { label: "에너지 효율", value: "$3,000,000,000 (USD)" },
      { label: "보안 시스템", value: "$2,000,000,000 (USD)" }
    ],
    signDate: "2026년 1월 1일"
  };

  // --- State ---
  let isSigned = $state(false);

  function handleSign() {
    isSigned = true;
  }

  function submitContract() {
    if (!isSigned) return;
    alert("계약이 체결되었습니다! 공장 건설을 시작합니다.");
    goto(`/business/company/${$page.params.id}/factory`);
  }
</script>

<svelte:head>
  <title>공장 건설 - 견적 및 계약</title>
</svelte:head>

<div class="page-container">

  <div class="page-title">
    <h2>공장 건설 - 3. 견적 확인 및 계약</h2>
  </div>

  <div class="stepper">
    <div class="step-item completed">
      <div class="step-icon check">✓</div>
      <span class="step-label">지역/등급 선택</span>
    </div>
    <div class="step-line active-line"></div>
    <div class="step-item completed">
      <div class="step-icon check">✓</div>
      <span class="step-label">세부 설정</span>
    </div>
    <div class="step-line active-line"></div>
    <div class="step-item active">
      <div class="step-icon check">✓</div>
      <span class="step-label">견적 및 계약</span>
    </div>
  </div>

  <div class="contract-wrapper">

    <div class="paper-card">
      <h1 class="doc-title">{contractData.companyName}</h1>
      <div class="doc-divider"></div>

      <div class="article">
        <h4 class="article-title">제1조 [계약 당사자]</h4>
        <p class="article-text">본 계약은 표준 공장 건설을 위하여 아래 당사자 간에 체결하며, 상호 신의와 성실을 원칙으로 계약을 이행한다.</p>
        <div class="sub-section">
          <p>1. 발주자 (갑)</p>
          <div class="indent">
            <span>상호명 : 금성</span><br>
            <span>대표자 : {contractData.clientName}</span>
          </div>
        </div>
        <div class="sub-section">
          <p>2. 시공사 (을)</p>
          <div class="indent">
            <span>상호명 : {contractData.contractorName}</span><br>
            <span>대표자 : Quant</span>
          </div>
        </div>
      </div>

      <div class="article">
        <h4 class="article-title">제2조 [계약 목적]</h4>
        <p class="article-text">본 계약은 '갑'이 계획하는 공장 건설 사업을 '을'이 수급하여, 약정된 설계와 사양에 따라 기한 내에 완공하는 것을 목적으로 한다.</p>
      </div>

      <div class="article">
        <h4 class="article-title">제3조 [계약 기간 및 완공일]</h4>
        <p class="article-text">{contractData.startDate}부터 {contractData.endDate}까지</p>
      </div>

      <div class="article">
        <h4 class="article-title">제4조 [총 계약 금액 및 지불 조건]</h4>
        <p class="article-text highlight-text">계약금: {contractData.totalAmount}</p>
        <div class="cost-breakdown">
          <p class="sub-title">세부 내역:</p>
          {#each contractData.breakdown as item}
            <div class="cost-row">
              <span class="c-label">- {item.label}</span>
              <div class="c-dots"></div>
              <span class="c-value">{item.value}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="paper-card">
      <div class="article">
        <h4 class="article-title">제5조 [책임 및 의무 조항]</h4>
        <p class="article-text">
          '을(시공사)'은 본 계약 및 첨부된 설계 도서와 시방서에 의거하여 성실하게 공사를 시공하여야 하며, 공사 기간 중 발생하는 제반 사고 및 현장 안전 관리에 대한 민·형사상의 모든 책임을 진다. 또한, 관계 법령을 준수하고 '갑(발주자)'의 정당한 지시를 이행하여 품질 확보에 만전을 기해야 한다.
        </p>
      </div>

      <div class="article">
        <h4 class="article-title">제6조 [일반 조항]</h4>
        <p class="article-text">
          본 계약에 명시되지 않은 사항은 일반적인 건설 관행 및 대한민국의 관계 법령에 따르며, 양 당사자는 신의와 성실의 원칙에 입각하여 본 계약을 이행하여야 한다. 계약 내용의 해석에 이견이 있을 경우 상호 협의하여 결정하며, 협의가 이루어지지 않을 경우 관할 법원의 판결에 따른다.
        </p>
        <ol class="legal-list">
          <li>계약 변경 및 해지: 설계 변경, 물가 변동, 기타 사유로 인하여 공사 내용 및 계약 금액의 조정이 필요한 경우, 양 당사자는 서면 합의를 통해 계약을 변경할 수 있다.</li>
          <li>불가항력 및 면책: 천재지변, 전쟁, 전염병 등 불가항력적인 사유로 인하여 공사 수행이 불가능하거나 지연된 경우, '을'은 그에 대한 지체 책임을 지지 않는다.</li>
        </ol>
      </div>

      <div class="signature-section">
        <div class="sign-date">{contractData.signDate}</div>

        <div class="signer-block">
          <div class="signer-label">수급인 서명</div>
          <div class="signature-img">Quant</div>
        </div>

        <div class="signer-block">
          <div class="signer-label">도급인 서명</div>
          <div class="signature-area">
            {#if isSigned}
              <div class="signature-script fade-in">{contractData.clientName}</div>
            {:else}
              <button class="btn-sign-here" onclick={handleSign}>
                서명하기
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="footer-actions">
    <button
      class="btn-submit"
      class:disabled={!isSigned}
      onclick={submitContract}
      disabled={!isSigned}
    >
      계약하기
    </button>
  </div>

</div>

<style>
  /* --- Global Reset & Fonts --- */
  * { box-sizing: border-box; }
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
    display: flex; flex-direction: column;
  }

  /* --- Header --- */
  .page-title h2 { font-size: 24px; font-weight: 700; margin: 0 0 32px 0; }

  /* --- Stepper --- */
  .stepper { display: flex; align-items: center; margin-bottom: 32px; }
  .step-item { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-text-gray); }
  .step-item.active, .step-item.completed { color: var(--color-text); }
  .step-item.completed { color: var(--color-theme-1); }

  .step-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: 12px; font-weight: 700; background-color: var(--color-border); color: white;
  }
  .step-item.active .step-icon, .step-item.completed .step-icon { background-color: var(--color-theme-1); }

  .step-line { flex: 1; height: 2px; background-color: var(--color-border); margin: 0 16px; }
  .step-line.active-line { background-color: var(--color-theme-1); }

  /* --- Contract Paper Layout --- */
  .contract-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }

  .paper-card {
    background: var(--color-bg-1);
    padding: 40px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid var(--color-border);
    font-family: "Georgia", "Times New Roman", serif;
    color: var(--color-text);
    line-height: 1.6;
  }

  /* Document Typography */
  .doc-title {
    text-align: center; font-size: 24px; font-weight: 700; margin-bottom: 24px;
    letter-spacing: 1px;
  }
  .doc-divider {
    width: 60%; height: 2px; background-color: var(--color-text); margin: 0 auto 32px auto;
  }

  .article { margin-bottom: 24px; }
  .article-title {
    font-size: 16px; font-weight: 700; margin: 0 0 8px 0; color: var(--color-text);
  }
  .article-text { font-size: 14px; margin: 0 0 8px 0; text-align: justify; }
  .highlight-text { font-weight: 600; margin-bottom: 12px; }

  .sub-section { margin-top: 8px; font-size: 14px; }
  .sub-section p { font-weight: 600; margin: 0 0 4px 0; }
  .indent { padding-left: 16px; color: var(--color-text-gray); }

  /* Cost Breakdown (Dot Leader Effect) */
  .cost-breakdown {
    background-color: var(--color-bg-2); padding: 16px; border: 1px dashed var(--color-border); margin-top: 8px;
  }
  .sub-title { font-size: 13px; color: var(--color-text-gray); margin: 0 0 8px 0; }
  .cost-row {
    display: flex; align-items: flex-end; font-size: 13px; margin-bottom: 6px;
    font-family: "Consolas", "Monaco", monospace;
  }
  .c-label { white-space: nowrap; }
  .c-dots {
    flex: 1; border-bottom: 1px dotted var(--color-text-gray); margin: 0 8px 4px 8px;
  }
  .c-value { white-space: nowrap; font-weight: 600; }

  .legal-list { padding-left: 20px; font-size: 13px; color: var(--color-text-gray); margin-top: 8px; }
  .legal-list li { margin-bottom: 8px; }

  /* Signature Section */
  .signature-section {
    margin-top: 60px; text-align: right;
  }
  .sign-date { font-size: 16px; margin-bottom: 32px; font-weight: 600; text-align: center; }

  .signer-block {
    display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-bottom: 16px;
  }
  .signer-label { font-size: 14px; font-weight: 700; }

  .signature-img {
    font-family: "Brush Script MT", cursive;
    font-size: 28px; color: var(--color-text); width: 120px; text-align: center;
  }

  .signature-area { width: 120px; height: 40px; display: flex; justify-content: center; align-items: center; }

  .signature-script {
    font-family: "Brush Script MT", cursive;
    font-size: 28px; color: var(--color-theme-1);
  }
  .fade-in { animation: fadeIn 0.5s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .btn-sign-here {
    background: var(--color-bg-1); border: 1px solid var(--color-border); padding: 6px 12px;
    border-radius: 4px; font-size: 12px; cursor: pointer; color: var(--color-text-gray);
    transition: 0.2s;
    animation: subtlePulse 1.2s ease-out infinite;
  }
  .btn-sign-here:hover {
    background: var(--color-bg-2); color: var(--color-text); border-color: var(--color-text-gray);
    animation: none;
  }
  @keyframes subtlePulse {
    0% { box-shadow: 0 0 0 0 rgba(15, 76, 129, 0.4); }
    100% { box-shadow: 0 0 0 8px rgba(15, 76, 129, 0); }
  }

  /* --- Footer --- */
  .footer-actions {
    display: flex; justify-content: flex-end; margin-top: 16px;
  }
  .btn-submit {
    background-color: #0f4c81; color: white; border: none;
    padding: 14px 48px; border-radius: 6px; font-size: 16px; font-weight: 600;
    cursor: pointer; transition: 0.2s;
  }
  .btn-submit:hover { background-color: #0c3b66; }
  .btn-submit.disabled {
    background-color: var(--color-text-gray); cursor: not-allowed; opacity: 0.7;
  }

  /* --- Responsive --- */
  @media (max-width: 900px) {
    .contract-wrapper { grid-template-columns: 1fr; }
  }
</style>
