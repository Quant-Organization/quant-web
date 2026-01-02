<script lang="ts">
    import SideBar from '$lib/components/SideBar.svelte';
    import { onMount } from 'svelte';
    import { updateSection, selectedIndex, sidebarConfigs } from '$lib/stores/sidebar';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    let { children } = $props();

    onMount(() => {
        updateSection('dashboard');
        
        const currentPath = get(page).url.pathname;
        const items = sidebarConfigs.dashboard;
        const index = items.findIndex(item => item.link === currentPath);
        
        if (index !== -1) {
            selectedIndex.set(index);
        }
    });
</script>

<div class="page-container">
    <SideBar />
    <div class="content">
        {@render children()}
    </div>
</div>

<style>
    .page-container {
        display: flex;
        width: 100%;
        height: 100%;
    }

    .content {
        flex: 1;
        padding-left: 2rem;
        padding-right: 2rem;
        padding-top: 1.4rem;
        overflow-y: auto;
        background-color: var(--color-bg-0);
    }
</style>
