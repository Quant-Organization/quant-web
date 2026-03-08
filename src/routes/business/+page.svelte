<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/business/dashboard');
    });
</script>

<svelte:head>
    <title>내 비즈니스</title>
</svelte:head>
