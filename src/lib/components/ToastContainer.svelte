<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { cubicOut } from 'svelte/easing';
    import { toast } from '$lib/stores/toast';

    const typeConfig = {
        success: { icon: '✓', color: '#10b981', bg: '#ecfdf5', border: '#10b981' },
        error:   { icon: '✕', color: '#ef4444', bg: '#fef2f2', border: '#ef4444' },
        warning: { icon: '!', color: '#d97706', bg: '#fffbeb', border: '#f59e0b' },
        info:    { icon: 'i', color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' }
    };
</script>

{#if $toast.length > 0}
    <div class="toast-container">
        {#each $toast as t (t.id)}
            <div
                class="toast-item"
                style="--toast-color: {typeConfig[t.type].color}; --toast-bg: {typeConfig[t.type].bg}; --toast-border: {typeConfig[t.type].border}"
                in:fly={{ y: -40, duration: 300, easing: cubicOut }}
                out:fade={{ duration: 200 }}
                animate:flip={{ duration: 250 }}
            >
                <span class="toast-icon">{typeConfig[t.type].icon}</span>
                <span class="toast-message">{t.message}</span>
                <button class="toast-close" onclick={() => toast.remove(t.id)}>✕</button>
            </div>
        {/each}
    </div>
{/if}

<style>
    .toast-container {
        position: fixed;
        top: 1.25rem;
        right: 1.25rem;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 380px;
    }

    .toast-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.75rem 1rem;
        background: var(--toast-bg);
        border: 1px solid var(--toast-border);
        border-left: 4px solid var(--toast-border);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        font-size: 0.875rem;
        line-height: 1.4;
    }

    .toast-icon {
        flex-shrink: 0;
        width: 1.4rem;
        height: 1.4rem;
        border-radius: 50%;
        background: var(--toast-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 800;
    }

    .toast-message {
        flex: 1;
        color: #1f2937;
        font-weight: 500;
    }

    .toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 0.75rem;
        padding: 0.2rem;
        line-height: 1;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
    }

    .toast-close:hover {
        color: #374151;
        background: rgba(0, 0, 0, 0.06);
    }
</style>
