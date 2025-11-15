<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/asset/overview');
    });
</script>

<svelte:head>
    <title>내 자산</title>
</svelte:head>
