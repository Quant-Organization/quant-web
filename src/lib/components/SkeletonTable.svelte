<script lang="ts">
    import Skeleton from '$lib/components/Skeleton.svelte';
    let { rows = 8, cols = 4, showHeader = true, showStats = false } = $props();
</script>

<div class="skeleton-page">
    {#if showHeader}
        <div class="sk-header">
            <Skeleton width="12rem" height="1.75rem" />
            <Skeleton width="20rem" height="1rem" style="margin-top: 0.5rem;" />
        </div>
    {/if}

    {#if showStats}
        <div class="sk-stats">
            {#each Array(3) as _}
                <div class="sk-stat-card">
                    <Skeleton width="5rem" height="0.75rem" />
                    <Skeleton width="4rem" height="1.5rem" style="margin-top: 0.5rem;" />
                </div>
            {/each}
        </div>
    {/if}

    <div class="sk-card">
        <div class="sk-table-header">
            {#each Array(cols) as _, i}
                <Skeleton width={i === 0 ? '25%' : '15%'} height="0.875rem" />
            {/each}
        </div>
        {#each Array(rows) as _}
            <div class="sk-table-row">
                {#each Array(cols) as _, i}
                    <Skeleton width={i === 0 ? '25%' : '15%'} height="0.875rem" />
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .skeleton-page { width: 100%; }
    .sk-header { margin-bottom: 1.5rem; }
    .sk-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .sk-stat-card {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        padding: 1rem 1.5rem;
        min-width: 8rem;
    }
    .sk-card {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        overflow: hidden;
    }
    .sk-table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1.25rem;
        border-bottom: 2px solid #e5e7eb;
        background: #f9fafb;
    }
    .sk-table-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1.25rem;
        border-bottom: 1px solid #f3f4f6;
    }
</style>
