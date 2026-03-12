<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import {page} from '$app/stores';
    import arrow from '$lib/images/arrow.svg';
    import bankIcon from '$lib/images/bank.svg';

    import { getSpringAccount } from '$lib/api/dashboard';
    import { getLoanProducts, getLoanProductsByTier, getLoanDetail, estimateLoan, applyLoan, getActiveLoans, repayLoan, repayFullLoan, getLoanSchedule, type LoanProductResponse, type LoanEstimateResponse, type UserLoanResponse, type PaymentScheduleItem } from '$lib/api/loan';
    import { getBankProducts } from '$lib/api/bank';
    import SkeletonTable from '$lib/components/SkeletonTable.svelte';
    import { toast } from 'svelte-sonner';

    let currentBalance = $state(0);
    let loanProducts = $state<LoanProductResponse[]>([]);
    let activeLoans = $state<UserLoanResponse[]>([]);
    let selectedProduct = $state<LoanProductResponse | null>(null);
    let applyAmount = $state(50000000);
    let applyTerm = $state(36);
    let repaymentMethod = $state('EQUAL_PRINCIPAL_INTEREST');
    let estimate = $state<LoanEstimateResponse | null>(null);
    let estimating = $state(false);
    let applying = $state(false);
    let applyError = $state('');
    let applySuccess = $state('');
    let loaded = $state(false);

    // Tier filter state
    let selectedTier = $state(0); // 0 = all

    // Repayment state
    let repayingId = $state<number | null>(null);
    let expandedLoanId = $state<number | null>(null);
    let scheduleMap = $state<Record<number, PaymentScheduleItem[]>>({});

    // Loan detail state
    let detailLoanId = $state<number | null>(null);
    let loanDetail = $state<UserLoanResponse | null>(null);
    let loadingDetail = $state(false);

    // URL params for pre-selecting bank
    let bankId = $state<number | null>(null);
    let bankName = $state('');
    let bankRate = $state(0);
    let bankTier = $state(0);

    let MIN_AMOUNT = $derived(selectedProduct?.minAmount ?? 1_000_000);
    let MAX_AMOUNT = $derived(selectedProduct?.maxAmount ?? 150_000_000);

    let sliderPercent = $derived(((applyAmount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100);
    let sliderStyle = $derived(`background: linear-gradient(to right, #1e5a8e 0%, #1e5a8e ${sliderPercent}%, #e5e7eb ${sliderPercent}%, #e5e7eb 100%);`);

    onMount(async () => {
        try {
            const account = await getSpringAccount();
            currentBalance = account.cashBalance ?? 0;
        } catch { /* fallback */ }

        // URL에서 은행 정보 파싱
        const bankIdParam = $page.url.searchParams.get('bankId');
        const bankNameParam = $page.url.searchParams.get('bankName');
        const rateParam = $page.url.searchParams.get('rate');
        const tierParam = $page.url.searchParams.get('tier');

        if (bankIdParam) bankId = Number(bankIdParam);
        if (bankNameParam) bankName = decodeURIComponent(bankNameParam);
        if (rateParam) bankRate = Number(rateParam);
        if (tierParam) bankTier = Number(tierParam);

        // 대출 상품 로드 (bankId가 있으면 해당 은행 상품만 조회)
        try {
            const productsFetcher = bankId
                ? getBankProducts(bankId)
                : bankTier ? getLoanProductsByTier(bankTier) : getLoanProducts();
            if (bankTier) selectedTier = bankTier;
            const [products, loans] = await Promise.all([
                productsFetcher as Promise<LoanProductResponse[]>,
                getActiveLoans().catch(() => [] as UserLoanResponse[])
            ]);
            loanProducts = products;
            activeLoans = loans;
            // bankId에 맞는 상품 선택
            if (products.length > 0) {
                if (bankId) {
                    const found = products.find(p => p.bank.id === bankId);
                    selectedProduct = found ?? products[0];
                } else {
                    selectedProduct = products[0];
                }
                applyAmount = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, applyAmount));
                applyTerm = Math.max(selectedProduct!.minTermMonths, Math.min(selectedProduct!.maxTermMonths, applyTerm));
            }
        } catch (e) {
            console.error('대출 상품 로드 실패:', e);
        } finally {
            loaded = true;
        }
    });

    async function updateEstimate() {
        if (!selectedProduct) return;
        estimating = true;
        try {
            estimate = await estimateLoan({
                loanProductId: selectedProduct.id,
                amount: applyAmount,
                termMonths: applyTerm,
                repaymentType: repaymentMethod
            });
        } catch {
            estimate = null;
        } finally {
            estimating = false;
        }
    }

    async function handleFinalLoan() {
        if (!selectedProduct) return;
        applying = true;
        applyError = '';
        applySuccess = '';
        try {
            await applyLoan({
                loanProductId: selectedProduct.id,
                amount: applyAmount,
                termMonths: applyTerm,
                repaymentType: repaymentMethod
            });
            applySuccess = `${selectedProduct.bank.name}에서 ${applyAmount.toLocaleString()}원 대출 신청이 완료되었습니다!`;
            toast.success(`${selectedProduct.bank.name}에서 ${applyAmount.toLocaleString()}원 대출 신청이 완료되었습니다!`);
            activeLoans = await getActiveLoans();
        } catch (e: unknown) {
            applyError = e instanceof Error ? e.message : '대출 신청에 실패했습니다.';
            toast.error(e instanceof Error ? e.message : '대출 신청에 실패했습니다.');
        } finally {
            applying = false;
        }
    }

    function goBack() {
        goto('/dashboard/bank');
    }

    async function handleRepay(loanId: number) {
        repayingId = loanId;
        try {
            await repayLoan(loanId);
            activeLoans = await getActiveLoans();
            applySuccess = '상환 완료되었습니다.';
            toast.success('상환 완료되었습니다.');
        } catch {
            applyError = '상환에 실패했습니다.';
            toast.error('상환에 실패했습니다.');
        } finally {
            repayingId = null;
        }
    }

    async function handleRepayFull(loanId: number) {
        repayingId = loanId;
        try {
            await repayFullLoan(loanId);
            activeLoans = await getActiveLoans();
            applySuccess = '전액 상환 완료되었습니다.';
            toast.success('전액 상환 완료되었습니다.');
        } catch {
            applyError = '전액 상환에 실패했습니다.';
            toast.error('전액 상환에 실패했습니다.');
        } finally {
            repayingId = null;
        }
    }

    async function toggleSchedule(loanId: number) {
        if (expandedLoanId === loanId) {
            expandedLoanId = null;
            return;
        }
        expandedLoanId = loanId;
        if (!scheduleMap[loanId]) {
            try {
                scheduleMap[loanId] = await getLoanSchedule(loanId);
            } catch { scheduleMap[loanId] = []; }
        }
    }

    async function handleTierFilter(tier: number) {
        selectedTier = tier;
        try {
            loanProducts = tier === 0 ? await getLoanProducts() : await getLoanProductsByTier(tier);
            if (loanProducts.length > 0 && !loanProducts.find(p => p.id === selectedProduct?.id)) {
                selectedProduct = loanProducts[0];
            }
        } catch (e) {
            console.error('대출 상품 필터 실패:', e);
            toast.error('대출 상품 필터에 실패했습니다.');
        }
    }

    async function handleShowDetail(loanId: number) {
        if (detailLoanId === loanId) {
            detailLoanId = null;
            loanDetail = null;
            return;
        }
        detailLoanId = loanId;
        loadingDetail = true;
        loanDetail = null;
        try {
            loanDetail = await getLoanDetail(loanId);
        } catch {
            loanDetail = null;
        } finally {
            loadingDetail = false;
        }
    }

    // amount/term 변경 시 자동 견적 (debounce)
    let debounceTimer: ReturnType<typeof setTimeout>;
    $effect(() => {
        if (selectedProduct && applyAmount && applyTerm && repaymentMethod) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateEstimate, 500);
        }
    });
</script>

{#if selectedProduct}
    <div class="bank-container">
        <div class="hero-section">
            <div class="top-bar">
                <div class="top-bar-left">
                    <button class="back-button" onclick={goBack}>
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
                        {#if selectedProduct.bank.logoUrl}
                            <img src={selectedProduct.bank.logoUrl} alt="bank"/>
                        {:else}
                            <span>🏦</span>
                        {/if}
                        <span>{selectedProduct.bank.name}</span>
                    </div>
                </div>

                <div class="loan-content-grid">
                    <!-- 왼쪽 폼 -->
                    <div class="loan-form-card">
                        {#if !bankId}
                        <div class="tier-filter-row">
                            {#each [{ label: '전체', value: 0 }, { label: '1등급', value: 1 }, { label: '2등급', value: 2 }, { label: '3등급', value: 3 }] as tier}
                                <button
                                    class="tier-btn"
                                    class:active={selectedTier === tier.value}
                                    onclick={() => handleTierFilter(tier.value)}
                                >{tier.label}</button>
                            {/each}
                        </div>
                        {/if}
                        <div class="form-row two-col">
                            <div class="input-group">
                                <label for="loan-product">대출 상품</label>
                                <select id="loan-product" class="custom-select"
                                    onchange={(e) => {
                                        const found = loanProducts.find(p => p.id === Number((e.target as HTMLSelectElement).value));
                                        if (found) {
                                            selectedProduct = found;
                                            applyAmount = Math.max(found.minAmount, Math.min(found.maxAmount, applyAmount));
                                            applyTerm = Math.max(found.minTermMonths, Math.min(found.maxTermMonths, applyTerm));
                                        }
                                    }}>
                                    {#each loanProducts as product}
                                        <option value={product.id} selected={product.id === selectedProduct.id}>
                                            {product.bank.name} - {product.name}
                                        </option>
                                    {/each}
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="loan-term">대출 기간</label>
                                <select id="loan-term" class="custom-select" bind:value={applyTerm}>
                                    {#each Array.from({ length: selectedProduct!.maxTermMonths - selectedProduct!.minTermMonths + 1 }, (_, i) => selectedProduct!.minTermMonths + i) as months}
                                        <option value={months}>{months}개월</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="section-wrapper">
                                <h2 class="section-outer-title">대출액</h2>
                                <div class="amount-card">
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

                        <div class="section-wrapper">
                            <h2 class="section-outer-title">상환 방식</h2>
                            <div class="form-row">
                                <div class="repayment-card">
                                    <div class="radio-group">
                                        <label class="radio-item"
                                               class:selected={repaymentMethod === 'EQUAL_PRINCIPAL_INTEREST'}>
                                            <input type="radio" name="method" value="EQUAL_PRINCIPAL_INTEREST"
                                                   bind:group={repaymentMethod}>
                                            <span class="radio-circle" aria-hidden="true"></span>
                                            <span>원리금균등상환</span>
                                        </label>
                                        <label class="radio-item" class:selected={repaymentMethod === 'BULLET'}>
                                            <input type="radio" name="method" value="BULLET"
                                                   bind:group={repaymentMethod}>
                                            <span class="radio-circle" aria-hidden="true"></span>
                                            <span>만기일시상환</span>
                                        </label>
                                        <label class="radio-item"
                                               class:selected={repaymentMethod === 'EQUAL_PRINCIPAL'}>
                                            <input type="radio" name="method" value="EQUAL_PRINCIPAL"
                                                   bind:group={repaymentMethod}>
                                            <span class="radio-circle" aria-hidden="true"></span>
                                            <span>원금균등상환</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 현재 대출 목록 -->
                        {#if activeLoans.length > 0}
                        <div class="section-wrapper">
                            <h2 class="section-outer-title">진행 중인 대출</h2>
                            <div class="active-loans-list">
                                {#each activeLoans as loan}
                                    <div class="active-loan-item">
                                        <div class="loan-info-row">
                                            <span class="loan-bank">{loan.bank.name}</span>
                                            <span class="loan-amount">{loan.remainingPrincipal.toLocaleString()}원 남음</span>
                                            <span class="loan-rate">{loan.interestRate}%</span>
                                            <span class="loan-status">{loan.statusName}</span>
                                        </div>
                                        <div class="loan-action-row">
                                            <button class="btn-schedule" onclick={() => toggleSchedule(loan.id)}>
                                                {expandedLoanId === loan.id ? '일정 닫기' : '상환 일정'}
                                            </button>
                                            <button class="btn-detail" onclick={() => handleShowDetail(loan.id)}>
                                                {detailLoanId === loan.id ? '닫기' : '상세 보기'}
                                            </button>
                                            <button class="btn-repay" onclick={() => handleRepay(loan.id)} disabled={repayingId === loan.id}>
                                                {repayingId === loan.id ? '처리 중...' : '월 상환'}
                                            </button>
                                            <button class="btn-repay-full" onclick={() => handleRepayFull(loan.id)} disabled={repayingId === loan.id}>
                                                전액 상환
                                            </button>
                                        </div>
                                        {#if detailLoanId === loan.id}
                                            <div class="loan-detail-panel">
                                                {#if loadingDetail}
                                                    <p class="detail-loading">상세 정보 불러오는 중...</p>
                                                {:else if loanDetail}
                                                    <div class="detail-grid">
                                                        <div class="detail-row"><span class="d-label">대출 시작일</span><span class="d-val">{loanDetail.startDate}</span></div>
                                                        <div class="detail-row"><span class="d-label">만기일</span><span class="d-val">{loanDetail.maturityDate}</span></div>
                                                        <div class="detail-row"><span class="d-label">대출 원금</span><span class="d-val">{loanDetail.principalAmount.toLocaleString()}원</span></div>
                                                        <div class="detail-row"><span class="d-label">잔여 원금</span><span class="d-val">{loanDetail.remainingPrincipal.toLocaleString()}원</span></div>
                                                        <div class="detail-row"><span class="d-label">총 납부액</span><span class="d-val">{(loanDetail.totalInterestPaid + loanDetail.principalAmount - loanDetail.remainingPrincipal).toLocaleString()}원</span></div>
                                                        <div class="detail-row"><span class="d-label">다음 납부일</span><span class="d-val">{loanDetail.nextPaymentDate}</span></div>
                                                        <div class="detail-row"><span class="d-label">다음 납부액</span><span class="d-val">{loanDetail.monthlyPayment.toLocaleString()}원</span></div>
                                                        <div class="detail-row"><span class="d-label">상태</span><span class="d-val">{loanDetail.statusName}</span></div>
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}
                                        {#if expandedLoanId === loan.id && scheduleMap[loan.id]}
                                            <div class="schedule-table-wrap">
                                                <table class="schedule-table">
                                                    <thead><tr><th>회차</th><th>원금</th><th>이자</th><th>월납부액</th><th>잔여원금</th></tr></thead>
                                                    <tbody>
                                                        {#each scheduleMap[loan.id] as row}
                                                            <tr>
                                                                <td>{row.month}</td>
                                                                <td>{row.principal.toLocaleString()}원</td>
                                                                <td>{row.interest.toLocaleString()}원</td>
                                                                <td>{row.totalPayment.toLocaleString()}원</td>
                                                                <td>{row.remainingPrincipal.toLocaleString()}원</td>
                                                            </tr>
                                                        {/each}
                                                    </tbody>
                                                </table>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                        {/if}
                    </div>

                    <!-- 오른쪽 요약 사이드바 -->
                    <div class="loan-summary-sidebar">
                        <div class="estimated-card">
                            <div class="estimated-bg-circle large"></div>
                            <div class="estimated-bg-circle small"></div>
                            <div class="estimated-content">
                                <div class="est-label">예상 월 상환금</div>
                                <div class="est-amount">
                                    {estimating ? '계산 중...' : estimate ? `$${estimate.monthlyPayment.toLocaleString()}` : `$0`}
                                </div>
                            </div>
                        </div>

                        <div class="summary-details-card">
                            <h3>신청 요약</h3>
                            {#if applyError}<p class="error-text">{applyError}</p>{/if}
                            {#if applySuccess}<p class="success-text">{applySuccess}</p>{/if}
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">대출 은행</span>
                                    <span class="value">{selectedProduct.bank.name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 상품</span>
                                    <span class="value">{selectedProduct.name}</span>
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
                                    <span class="value">연 {selectedProduct.baseInterestRate}%</span>
                                </div>
                                {#if estimate}
                                <div class="detail-item">
                                    <span class="label">총 납부액</span>
                                    <span class="value">{estimate.totalPayment.toLocaleString()}원</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">총 이자</span>
                                    <span class="value">{estimate.totalInterest.toLocaleString()}원</span>
                                </div>
                                {/if}
                            </div>
                        </div>

                        <button class="final-apply-btn" onclick={handleFinalLoan} disabled={applying}>
                            {applying ? '신청 중...' : '대출 받기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else if loaded}
    <div class="empty-state">
        <div class="empty-icon">🏦</div>
        <h2>현재 이용 가능한 대출 상품이 없습니다</h2>
        <p>잠시 후 다시 시도해 주세요.</p>
        <button class="back-to-bank-btn" onclick={() => goto('/dashboard/bank')}>은행 목록으로 돌아가기</button>
    </div>
{:else}
    <div class="loading-state">
        <SkeletonTable rows={6} cols={4} showHeader={false} />
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

    .final-apply-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .error-text {
        color: #ef4444;
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
    }

    .success-text {
        color: #10b981;
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
    }

    .active-loans-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .active-loan-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
    }
    .loan-info-row { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr; gap: 0.5rem; }
    .loan-action-row { display: flex; gap: 0.5rem; }
    .btn-schedule { padding: 0.3rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 0.8rem; }
    .btn-detail { padding: 0.3rem 0.75rem; border: 1px solid var(--color-theme-1); border-radius: 6px; background: white; color: var(--color-theme-1); cursor: pointer; font-size: 0.8rem; }
    .btn-repay { padding: 0.3rem 0.75rem; border: none; border-radius: 6px; background: var(--color-theme-1); color: white; cursor: pointer; font-size: 0.8rem; }
    .btn-repay-full { padding: 0.3rem 0.75rem; border: none; border-radius: 6px; background: #ef4444; color: white; cursor: pointer; font-size: 0.8rem; }
    .btn-repay:disabled, .btn-repay-full:disabled { opacity: 0.6; cursor: not-allowed; }
    .schedule-table-wrap { overflow-x: auto; margin-top: 0.5rem; max-height: 200px; overflow-y: auto; }
    .schedule-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .schedule-table th, .schedule-table td { padding: 0.3rem 0.5rem; border: 1px solid #e5e7eb; text-align: right; }
    .schedule-table th { background: #f9fafb; font-weight: 600; }
    .loan-detail-panel { margin-top: 0.75rem; padding: 0.75rem; background: #f8faff; border: 1px solid var(--color-border); border-radius: 8px; }
    .detail-loading { font-size: 0.85rem; color: #6b7280; margin: 0; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem; }
    .detail-row { display: flex; justify-content: space-between; font-size: 0.8rem; }
    .d-label { color: #6b7280; }
    .d-val { font-weight: 600; color: #1a1a1a; }
    .tier-filter-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tier-btn { padding: 0.3rem 0.85rem; border: 1px solid var(--color-border); border-radius: 20px; background: white; color: #6b7280; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.15s; }
    .tier-btn.active { background: var(--color-theme-1); color: white; border-color: var(--color-theme-1); }

    .loan-bank { font-weight: 600; color: var(--color-theme-1); }
    .loan-amount { color: #1a1a1a; }
    .loan-rate { color: #6b7280; }
    .loan-status { color: #10b981; font-weight: 600; }

    .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        color: #6b7280;
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

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 1rem;
        color: #6b7280;
    }
    .empty-icon { font-size: 3rem; }
    .empty-state h2 { font-size: 1.3rem; font-weight: 700; color: #1a1a1a; margin: 0; }
    .empty-state p { font-size: 0.95rem; margin: 0; }
    .back-to-bank-btn {
        margin-top: 1rem;
        padding: 0.8rem 2rem;
        background: var(--color-theme-1, #00529B);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    .back-to-bank-btn:hover { background: var(--color-theme-1-dark, #004480); }
</style>
