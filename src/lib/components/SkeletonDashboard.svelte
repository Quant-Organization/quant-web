<script lang="ts">
    import Skeleton from '$lib/components/Skeleton.svelte';
</script>

<!-- Stock/Coin/ETF 2-column layout skeleton -->
<div class="skeleton-layout">
    <div class="left">
        <!-- Header card -->
        <div class="sk-card header-sk">
            <div class="row">
                <Skeleton width="3rem" height="1.5rem" radius="999px" />
                <Skeleton width="12rem" height="1.5rem" />
            </div>
            <div class="row" style="margin-top: 0.75rem;">
                <Skeleton width="8rem" height="2rem" />
                <Skeleton width="4rem" height="1.5rem" radius="0.375rem" />
            </div>
        </div>
        <!-- Chart -->
        <div class="sk-card">
            <div class="row" style="gap: 0.5rem; margin-bottom: 0.75rem;">
                {#each Array(5) as _}
                    <Skeleton width="3rem" height="1.5rem" radius="0.375rem" />
                {/each}
            </div>
            <Skeleton width="100%" height="18rem" radius="0.5rem" />
        </div>
        <!-- Table -->
        <div class="sk-card">
            <Skeleton width="6rem" height="1rem" style="margin-bottom: 0.75rem;" />
            {#each Array(5) as _}
                <div class="table-row">
                    <Skeleton width="30%" height="0.875rem" />
                    <Skeleton width="20%" height="0.875rem" />
                    <Skeleton width="15%" height="0.875rem" />
                </div>
            {/each}
        </div>
    </div>
    <div class="right">
        <!-- Order panel -->
        <div class="sk-card">
            <div class="row" style="margin-bottom: 1rem;">
                <Skeleton width="45%" height="2rem" radius="0.5rem" />
                <Skeleton width="45%" height="2rem" radius="0.5rem" />
            </div>
            <Skeleton width="100%" height="1rem" style="margin-bottom: 0.5rem;" />
            <Skeleton width="100%" height="2.5rem" radius="0.5rem" style="margin-bottom: 0.75rem;" />
            <Skeleton width="100%" height="1rem" style="margin-bottom: 0.5rem;" />
            <Skeleton width="100%" height="2.5rem" radius="0.5rem" style="margin-bottom: 1rem;" />
            <Skeleton width="100%" height="2.75rem" radius="0.5rem" />
        </div>
        <!-- Info panel -->
        <div class="sk-card">
            <Skeleton width="5rem" height="1rem" style="margin-bottom: 0.75rem;" />
            {#each Array(3) as _}
                <div class="table-row">
                    <Skeleton width="40%" height="0.875rem" />
                    <Skeleton width="30%" height="0.875rem" />
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .skeleton-layout {
        display: flex;
        gap: 2rem;
        width: 100%;
    }
    .left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.25rem; }
    .right { width: 22rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .sk-card {
        background: #fff;
        border-radius: 0.875rem;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
    }
    .header-sk { padding: 1.125rem 1.375rem; }
    .row { display: flex; align-items: center; gap: 0.625rem; }
    .table-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    @media (max-width: 1100px) {
        .skeleton-layout { flex-direction: column; }
        .right { width: 100%; }
    }
</style>
