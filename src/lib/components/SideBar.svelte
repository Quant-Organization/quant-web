<script lang="ts">
    import { goto } from '$app/navigation';
    import { sidebarItems, selectedIndex as storeSelectedIndex, transitionDirection } from '$lib/stores/sidebar';
    import { balance, formatCurrency, refreshBalance } from '$lib/stores/asset';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount } from 'svelte';
    import setting from '$lib/images/setting.svg'

    let selectedIndex = 0;

    onMount(() => {
        refreshBalance();
    });

    $: items = $sidebarItems;

    storeSelectedIndex.subscribe(val => {
        selectedIndex = val;
    });

    function handleClick(index: number, link: string) {
        selectedIndex = index;
        storeSelectedIndex.set(index);
        goto(link);
    }

    $: itemHeight = 51;
    $: indicatorTop = selectedIndex * (itemHeight);
</script>

<div class="side-bar">
    <ul class="side-bar__list">
        <div class="active-indicator" style="transform: translateY({indicatorTop}px)"></div>
        {#key $sidebarItems}
            <div
                    class="items-container"
                    in:fly={{ x: $transitionDirection * 300, duration: 400, easing: quintOut }}
                    out:fly={{ x: $transitionDirection * -300, duration: 400, easing: quintOut }}
            >
                {#each items as item, index}
                    <li
                            class="side-bar__list-item"
                            in:fly={{ y: 30, duration: 400, delay: index * 80, easing: quintOut }}
                    >
                        <button
                                class="side-bar__list-item-container"
                                class:active={selectedIndex === index}
                                onclick={() => handleClick(index, item.link)}
                        >
                            <img src={item.img} alt={item.name}/>
                            <p class="side-bar__list-text">{item.name}</p>
                        </button>
                    </li>
                {/each}
            </div>
        {/key}
    </ul>
    <div class="side-bar__bottom">
        <div class="side-bar__balance-card">
            <span class="balance-label">잔고</span>
            <span class="balance-value">{formatCurrency($balance)}</span>
        </div>
        <div class="side-bar__divider"></div>
        <div class="side-bar__list-item-container">
            <img src={setting} alt="setting"/>
            <p>설정</p>
        </div>
    </div>
</div>

<style>
    .side-bar {
        width: 100%;
        max-width: 16rem;
        padding: 2rem 1.5rem;
        height: 100%;
        border-right: 0.0625rem solid var(--color-border);
        background-color: var(--color-bg-0);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .side-bar__list {
        position: relative;
        list-style: none;
        padding: 0;
        margin: 0;
        overflow: hidden;
        flex: 1;
        min-height: 0;
    }

    .items-container {
        position: absolute;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 5px;
        left: 0;
        top: 0;
    }

    .active-indicator {
        min-width: calc(100% - 3rem);
        width: 100%;
        position: absolute;
        height: 46px;
        background-color: rgba(59, 130, 246, 0.15);
        border-radius: 10px;
        transition: transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
        z-index: 0;
        pointer-events: none;
    }

    .side-bar__list-item {
        position: relative;
        z-index: 1;
    }

    .side-bar__list-item-container {
        min-width: calc(100% - 3rem);
        position: relative;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 11px 7px;
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.3s ease;
        color: var(--color-text-gray);
        width: 100%;
        text-align: left;
    }

    .side-bar__list-item-container.active {
        color: var(--color-theme-1);
    }

    .side-bar__list-item-container:hover {
        color: var(--color-theme-1);
    }

    .side-bar__list-text {
        font-weight: 600;
        font-size: 0.75rem;
        position: relative;
        z-index: 1;
        transition: color 0.3s ease;
    }

    img {
        width: 1.5rem;
        height: 1.5rem;
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
        filter: brightness(0) saturate(100%) invert(55%) sepia(8%) saturate(867%) hue-rotate(181deg) brightness(92%) contrast(86%);
    }

    .side-bar__list-item-container.active img {
        filter: brightness(0) saturate(100%) invert(23%) sepia(99%) saturate(1785%) hue-rotate(193deg) brightness(98%) contrast(101%);
    }

    .side-bar__list-item-container:hover img {
        filter: brightness(0) saturate(100%) invert(23%) sepia(99%) saturate(1785%) hue-rotate(193deg) brightness(98%) contrast(101%);
    }

    .side-bar__bottom {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .side-bar__balance-card {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        background-color: var(--color-theme-2);
        border: 0.0625rem solid var(--color-border);
        border-radius: 0.625rem;
    }

    .balance-label {
        font-size: 0.7rem;
        color: var(--color-text-gray);
        font-weight: 600;
    }

    .balance-value {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-theme-1);
    }

    .side-bar__divider {
        height: 0.0625rem;
        background-color: var(--color-border);
        margin: 0.75rem -1.5rem;
    }
</style>