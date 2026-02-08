<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import {page} from '$app/stores';
    import arrow from '$lib/images/arrow.svg';
    import bankIcon from '$lib/images/bank.svg';

    // --- 상태 (표준 Svelte 변수/리액티브 사용) ---
    let selectedBank: any = null;
    let currentBalance = 15000000;
    let applyAmount = 50000000;
    let applyTerm = 36;
    let repaymentMethod = 'equal_principal_interest';

    const MIN_AMOUNT = 1_000_000;
    const MAX_AMOUNT = 150_000_000;

    // 예상 월 상환금 (원리금균등 기준)
    $: estimatedMonthlyPayment = (() => {
        if (!selectedBank) return 0;
        const rate = selectedBank.rate / 100 / 12;
        const n = applyTerm;
        const payment = (applyAmount * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
        return Math.floor(payment);
    })();

    // 슬라이더 퍼센트 (버블 위치 계산용)
    $: sliderPercent = ((applyAmount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100;
    // 슬라이더의 그라디언트 스타일
    $: sliderStyle = `background: linear-gradient(to right, #1e5a8e 0%, #1e5a8e ${sliderPercent}%, #e5e7eb ${sliderPercent}%, #e5e7eb 100%);`;

    onMount(() => {
        const bankParam = $page.url.searchParams.get('bank');
        if (bankParam) {
            try {
                selectedBank = JSON.parse(decodeURIComponent(bankParam));
            } catch (e) {
                console.error('Failed to parse bank data:', e);
                goto('/dashboard/bank');
            }
        } else {
            goto('/dashboard/bank');
        }
    });

    function handleFinalLoan() {
        if (!selectedBank) return;
        alert(`${selectedBank.name}에서 ${applyAmount.toLocaleString()}원 대출 신청이 완료되었습니다.`);
        goto('/dashboard/bank');
    }

    function goBack() {
        goto('/dashboard/bank');
    }
</script>

{#if selectedBank}
    <div class="bank-container">
        <div class="hero-section">
            <div class="top-bar">
                <div class="top-bar-left">
                    <button class="back-button" on:click={goBack}>
                        <img src={arrow} alt="뒤로가기" class="back-arrow"/>
                    </button>
                    <h1 class="page-title">QUANT 은행 대출</h1>
                </div>
                <div class="top-bar-right">
                    <div class="balance-info">
                        <span class="page-title">현재 잔고: {currentBalance.toLocaleString()}원</span>
                    </div>
                </div>
            </div>

            <div class="hero-content">
                <div class="hero-bank-title">
                    <img src={bankIcon} alt="은행" class="bank-icon"/>
                    <span class="bank-text">은행 대출</span>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="loan-view">
                <div class="loan-header">
                    <h2>대출 신청</h2>
                    <div class="loan-bank-badge">
                        <img src={selectedBank.icon} alt="bank"/>
                        <span>{selectedBank.name}</span>
                    </div>
                </div>

                <div class="loan-content-grid">
                    <!-- 왼쪽 폼 (배경 제거됨) -->
                    <div class="loan-form-card">
                        <div class="form-row two-col">
                            <div class="input-group">
                                <label for="loan-type">대출 신청</label>
                                <select id="loan-type" class="custom-select">
                                    <option>신용 대출</option>
                                    <option>담보 대출</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="loan-term">대출 기간</label>
                                <select id="loan-term" class="custom-select" bind:value={applyTerm}>
                                    <option value={12}>12개월</option>
                                    <option value={24}>24개월</option>
                                    <option value={36}>36개월</option>
                                    <option value={48}>48개월</option>
                                    <option value={60}>60개월</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="section-wrapper">
                                <!-- 🔴 카드 바깥쪽 타이틀 -->
                                <h2 class="section-outer-title">대출액</h2>

                                <div class="amount-card">
                                    <!-- 🔴 카드 안쪽 타이틀 (기존 스타일 유지) -->
                                    <div class="amount-card-header">대출액</div>

                                    <div class="slider-wrapper">
                                        <div
                                                class="amount-bubble"
                                                style="left: {sliderPercent}%; transform: translateX(-50%) translateY(-16px);"
                                        >
                                            {applyAmount.toLocaleString()}원
                                        </div>

                                        <input
                                                id="amount"
                                                type="range"
                                                min={MIN_AMOUNT}
                                                max={MAX_AMOUNT}
                                                step="1000000"
                                                bind:value={applyAmount}
                                                class="range-slider"
                                                style={sliderStyle}
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>

                        <!-- 상환 방식 카드를 하나로 묶음 -->
                        <div class="section-wrapper">
                            <h2 class="section-outer-title">상환 방식</h2>
                            <div class="form-row">
                                <div class="repayment-card">
                                    <div class="radio-group">
                                        <label class="radio-item"
                                               class:selected={repaymentMethod === 'equal_principal_interest'}>
                                            <input type="radio" name="method" value="equal_principal_interest"
                                                   bind:group={repaymentMethod}>
                                            <span class="radio-circle" aria-hidden="true"></span>
                                            <span>원리금균등상환</span>
                                        </label>
                                        <label class="radio-item" class:selected={repaymentMethod === 'bullet'}>
                                            <input type="radio" name="method" value="bullet"
                                                   bind:group={repaymentMethod}>
                                            <span class="radio-circle" aria-hidden="true"></span>
                                            <span>만기일시상환</span>
                                        </label>
                                        <label class="radio-item"
                                               class:selected={repaymentMethod === 'equal_principal'}>
                                            <input type="radio" name="method" value="equal_principal"
                                                   bind:group={repaymentMethod}>
                                            <span class="radio-circle" aria-hidden="true"></span>
                                            <span>원금균등상환</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 오른쪽 요약 사이드바 -->
                    <div class="loan-summary-sidebar">
                        <div class="estimated-card">
                            <!-- 카드 상단 중앙에 위치하는 두 원 (크기별) -->
                            <div class="estimated-bg-circle large"></div>
                            <div class="estimated-bg-circle small"></div>

                            <div class="estimated-content">
                                <div class="est-label">예상 월 상환금</div>
                                <div class="est-amount">₩{estimatedMonthlyPayment.toLocaleString()}</div>
                            </div>
                        </div>

                        <div class="summary-details-card">
                            <h3>신청 요약</h3>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">대출 은행</span>
                                    <span class="value">{selectedBank.name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 상품</span>
                                    <span class="value">신용 대출</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 원금</span>
                                    <span class="value">{applyAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 기간</span>
                                    <span class="value">{applyTerm}개월</span>
                                </div>
                                <div class="detail-item highlight">
                                    <span class="label">예상 금리</span>
                                    <span class="value">연 {selectedBank.rate}%</span>
                                </div>
                            </div>
                        </div>

                        <button class="final-apply-btn" on:click={handleFinalLoan}>
                            대출 받기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .bank-container {
        width: 100%;
        padding: 1.4rem 0 2rem 0;
        margin-top: -1.4rem;
    }

    .hero-section {
        background: var(--color-theme-1);
        margin: -1.4rem -2rem 2rem -2rem;
        color: white;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 6rem;
        background: var(--color-theme-1-dark);
    }

    .top-bar-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .page-title {
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
        color: white;
    }

    .hero-content {
        display: flex;
        align-items: center;
        flex: 1;
        padding: 0 4rem 0 calc(192px + 2rem);
        position: relative;
    }

    .hero-bank-title {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .bank-icon {
        height: 10rem;
    }

    .bank-text {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
    }

    .main-content {
        padding: 0 4rem;
        min-height: 600px;
    }

    .loan-view {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .loan-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .loan-header h2 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        color: #1a1a1a;
    }

    .loan-bank-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--color-theme-1);
    }

    .loan-bank-badge img {
        height: 1.5rem;
    }

    .loan-content-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
    }

    .amount-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }

    .amount-card-header {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.8rem;
    }


    /* -------------------
       대출액 카드 배경 제거
       ------------------- */
    .loan-form-card {
        /* 배경 제거(transparent) - 요청한 대로 카드 세션의 배경을 지움 */
        background: transparent;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 0; /* 내부 여백은 필요하면 개별 요소에 추가 */
    }

    .form-row {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .form-row.two-col {
        flex-direction: row;
        gap: 1.5rem;
    }

    .input-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-group label {
        font-size: 0.95rem;
        color: #6b7280;
        font-weight: 500;
    }

    .custom-select {
        appearance: none;
        -webkit-appearance: none;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 1rem center;
        background-size: 1.2rem;
        cursor: pointer;
    }

    .amount-card-title {
        position: absolute;
        top: -0.7rem;
        right: 1rem;
        padding: 0 0.5rem;
        background: white;
        font-size: 0.85rem;
        font-weight: 600;
        color: #6b7280;
        z-index: 2;
    }

    .custom-select:focus {
        outline: 2px solid var(--color-theme-1);
        border-color: transparent;
    }

    /* 슬라이더 및 버블 */
    .slider-wrapper {
        position: relative;
        padding-top: 1.2rem;
        padding-bottom: 0; /* 🔴 하단 패딩 제거 */
    }

    .amount-bubble {
        position: absolute;
        top: 0;
        padding: 0.4rem 0.7rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 1rem;
        background: white;
        color: var(--color-theme-1);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        z-index: 3;
        pointer-events: none;
    }


    .range-slider {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        height: 12px;
        border-radius: 12px;
        outline: none;
        margin: 0;
        cursor: pointer;
        position: relative;
        z-index: 2;
    }

    .range-slider::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--color-theme-1);
        cursor: pointer;
        border: 4px solid white;
        box-shadow: 0 0 0 1px var(--color-theme-1);
    }

    /* 상환 방식 카드: 카드로 묶음, 선택시 '원(circle)'만 theme-1 색상으로 표시 */
    .repayment-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }

    .radio-group-label {
        font-size: 0.95rem;
        color: #6b7280;
        font-weight: 500;
        margin-bottom: 1rem;
    }

    .radio-group {
        display: flex;
        justify-content: space-between;
        padding: 0 4rem;
        gap: 4rem;
    }

    .radio-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.15s;
        justify-content: center;
        width: fit-content;
    }

    .radio-item input {
        display: none;
    }

    /* 원(circle) 기본 스타일 (선택 전) */
    .radio-circle {
        width: 18px;
        height: 18px;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        display: inline-block;
        position: relative;
        flex: 0 0 18px;
        background: transparent;
    }

    /* 선택된 항목에서는 '원'만 theme 색으로 표시 (요청사항) */
    .radio-item.selected .radio-circle {
        border-color: var(--color-theme-1);
        background: var(--color-theme-1);
    }

    /* 선택되었을 때 라벨 텍스트 색상은 진하게 유지하되 박스 전체를 채우지는 않음 */
    .radio-item.selected {
        color: #111827;
        border-color: #eef2f6;
    }

    /* 사이드바 / 예상 카드 */
    .loan-summary-sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .estimated-card {
        background: white;
        border-radius: 16px;
        padding: 2.2rem 2rem 2.4rem 2rem;
        border: 1px solid #e5e7eb;
        text-align: center;
        position: relative;
        overflow: hidden; /* 🔴 카드 밖 영역 안 보이게 */
        min-height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }


    .estimated-bg-circle {
        position: absolute;
        left: 50%;
        border-radius: 50%;
        pointer-events: none;
        transform: translateX(-50%);
    }

    /* 바깥쪽 큰 원 */
    .estimated-bg-circle.large {
        width: 20rem;
        height: 20rem;
        top: -12rem; /* 카드 안에서 상단만 살짝 보이게 */
        background: #f0f7ff;
        z-index: 0;
    }

    .section-outer-title {
        font-size: 0.95rem;
        color: #6b7280;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }


    /* 안쪽 작은 원 */
    .estimated-bg-circle.small {
        width: 15rem;
        height: 15rem;
        top: -9.5rem; /* 큰 원보다 조금 아래 */
        background: #e6f1ff;
        z-index: 1;
    }


    .estimated-content {
        position: relative;
        z-index: 1;
    }

    .est-label {
        color: #6b7280;
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }

    .est-amount {
        color: var(--color-theme-1);
        font-size: 2rem;
        font-weight: 800;
    }

    .summary-details-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }

    .summary-details-card h3 {
        margin: 0 0 1.5rem 0;
        font-size: 1.1rem;
    }

    .detail-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.95rem;
        color: #4b5563;
    }

    .detail-item .value {
        font-weight: 600;
        color: #1a1a1a;
    }

    .detail-item.highlight .value {
        color: var(--color-theme-1);
        font-size: 1.1rem;
    }

    .final-apply-btn {
        width: 100%;
        background: #00509d;
        color: white;
        padding: 1.2rem;
        border: none;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 4px 6px rgba(0, 80, 157, 0.2);
    }

    .final-apply-btn:hover {
        background: #003f7f;
    }

    .back-button {
        background: none;
        border: none;
        cursor: pointer;
        color: white;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .back-arrow {
        width: 1.5rem;
        height: 1.5rem;
        filter: brightness(0) invert(1);
        transform: rotate(90deg);
    }

    @media (max-width: 1024px) {
        .loan-content-grid {
            grid-template-columns: 1fr;
        }

        .hero-content, .main-content, .top-bar {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }

        .amount-bubble {
            font-size: 0.85rem;
            padding: 0.35rem 0.6rem;
        }
    }
</style>
