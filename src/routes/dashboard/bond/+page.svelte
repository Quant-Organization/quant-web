<script lang="ts">
    import dashBond from '$lib/images/dashboard_sidebar/bond.svg';
</script>

<div class="coming-soon">
    <div class="content">
        <img src={dashBond} alt="채권" class="icon" />
        <h1>채권</h1>
        <p>준비 중인 기능입니다.</p>
        <span class="sub">곧 다양한 채권 상품을 만나보실 수 있습니다.</span>
    </div>
</div>

<style>
    .coming-soon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        width: 100%;
    }

    .content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .icon {
        width: 4rem;
        height: 4rem;
        opacity: 0.4;
        margin-bottom: 0.5rem;
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 800;
        color: #1a1a1a;
        margin: 0;
    }

    p {
        font-size: 1.1rem;
        color: var(--color-text-gray);
        margin: 0;
        font-weight: 600;
    }

    .sub {
        font-size: 0.9rem;
        color: #b0b8c4;
    }
</style>
