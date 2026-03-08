<script lang="ts">
    import Skeleton from '$lib/components/Skeleton.svelte';
</script>

<div class="skeleton-profile">
    <!-- Profile header -->
    <div class="sk-card profile-header-sk">
        <div class="row">
            <Skeleton width="4.5rem" height="4.5rem" radius="50%" />
            <div class="col">
                <Skeleton width="8rem" height="1.25rem" />
                <Skeleton width="5rem" height="0.875rem" style="margin-top: 0.4rem;" />
                <Skeleton width="6rem" height="0.875rem" style="margin-top: 0.3rem;" />
            </div>
        </div>
    </div>

    <!-- Stats grid -->
    <div class="sk-grid-2">
        {#each Array(2) as _}
            <div class="sk-card stat-sk">
                <Skeleton width="5rem" height="0.75rem" />
                <Skeleton width="7rem" height="1.5rem" style="margin-top: 0.5rem;" />
            </div>
        {/each}
    </div>

    <!-- Sub-stats grid -->
    <div class="sk-grid-3">
        {#each Array(3) as _}
            <div class="sk-card stat-sk">
                <Skeleton width="5rem" height="0.75rem" />
                <Skeleton width="4rem" height="1.25rem" style="margin-top: 0.5rem;" />
            </div>
        {/each}
    </div>

    <!-- Asset counts -->
    <div class="sk-card">
        <Skeleton width="6rem" height="1rem" style="margin-bottom: 1rem;" />
        <div class="sk-grid-4">
            {#each Array(4) as _}
                <div class="asset-item-sk">
                    <Skeleton width="4rem" height="0.75rem" />
                    <Skeleton width="2rem" height="1.25rem" style="margin-top: 0.25rem;" />
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .skeleton-profile { width: 100%; display: flex; flex-direction: column; gap: 1.25rem; }
    .sk-card {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
    }
    .profile-header-sk { padding: 1.5rem; }
    .row { display: flex; align-items: center; gap: 1.25rem; }
    .col { display: flex; flex-direction: column; }
    .stat-sk { padding: 1rem 1.5rem; }
    .sk-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .sk-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    .sk-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .asset-item-sk { text-align: center; }
</style>
