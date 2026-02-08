<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    import { updateSection, selectedIndex, sidebarConfigs } from '$lib/stores/sidebar';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    let { children } = $props();

    function setSelectedIndexForPath(pathname: string) {
        const items = sidebarConfigs.asset;
        const index = items.findIndex(item => item.link === pathname);
        if (index !== -1) {
            selectedIndex.set(index);
        }
    }

    updateSection('asset');
    setSelectedIndexForPath(get(page).url.pathname);

    afterNavigate(({ to }) => {
        if (to?.url.pathname) {
            setSelectedIndexForPath(to.url.pathname);
        }
    });
</script>

<div class="content">
    {@render children()}
</div>

<style>
    .content {
        flex: 1;
        padding: 1.4rem 2rem;
        overflow-y: auto;
        background-color: var(--color-bg-0);
    }
</style>
