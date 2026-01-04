<script lang="ts">
    import SideBar from '$lib/components/SideBar.svelte';
    import { onMount } from 'svelte';
    import { updateSection } from '$lib/stores/sidebar';

    let { children } = $props();

    onMount(() => {
        updateSection('asset');
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
        padding: 1.4rem 2rem;
        overflow-y: auto;
        background-color: var(--color-bg-0);
    }
</style>
