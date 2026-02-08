<script lang="ts">
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import logo from '$lib/images/quant-logo.svg';
    import dot from '$lib/images/dot.svg';
    import star from '$lib/images/star.svg'
    import alam from '$lib/images/alam.svg'
    import profile from '$lib/images/profile.svg'
    import {updateSection, type SectionType, sectionOrder} from '$lib/stores/sidebar';

    export let playerName = "PlayerName";
    export let playerLevel = 42
    export let starCount = 8750;

    function handleNavClick(section: SectionType, path: string) {
        // 현재 섹션의 인덱스 찾기
        const currentPath = page.url.pathname;
        let currentSection: SectionType = 'dashboard';

        if (currentPath.startsWith('/dashboard')) currentSection = 'dashboard';
        else if (currentPath.startsWith('/asset')) currentSection = 'asset';
        else if (currentPath.startsWith('/business')) currentSection = 'business';
        else if (currentPath.startsWith('/leaderboard')) currentSection = 'leaderboard';

        const currentIndex = sectionOrder.indexOf(currentSection);
        const newIndex = sectionOrder.indexOf(section);

        // 방향 계산: 새 인덱스가 크면 오른쪽으로 이동 (1), 작으면 왼쪽으로 이동 (-1)
        const direction = newIndex > currentIndex ? 1 : -1;

        updateSection(section, direction);
        goto(path);
    }
</script>

<header>
    <div class="header-div">
        <div class="logo">
            <img src={logo} alt="logo"/>
            <p>QUANT</p>
        </div>
        <nav>
            <ul>
                <li aria-current={page.url.pathname.startsWith('/dashboard') ? 'page' : undefined}>
                    <button onclick={() => handleNavClick('dashboard', '/dashboard')}>대시보드</button>
                </li>
                <li aria-current={page.url.pathname.startsWith('/asset') ? 'page' : undefined}>
                    <button onclick={() => handleNavClick('asset', '/asset')}>내 자산</button>
                </li>
                <li aria-current={page.url.pathname.startsWith('/business') ? 'page' : undefined}>
                    <button onclick={() => handleNavClick('business', '/business')}>내 비즈니스</button>
                </li>
                <li aria-current={page.url.pathname.startsWith('/leaderboard') ? 'page' : undefined}>
                    <button onclick={() => handleNavClick('leaderboard', '/leaderboard')}>리더보드</button>
                </li>
            </ul>
        </nav>
        <div class="user-info">
            <div class="user-info-div">
                <p class="player-name">{playerName}</p>
                <div class="stats">
                    <p class="stat-value">레벨 {playerLevel}</p>
                    <img src={dot} alt="dot"/>
                    <div class="stat-value">
                        <img src="{star}" alt="star">
                        <p class="stat-value">{starCount}</p>
                    </div>
                </div>
            </div>
            <div class="user-icon-info-div">
                <img src="{alam}" alt="alam" class="bell"/>
                <img src="{profile}" alt="profile" class="profile"/>
            </div>
        </div>
    </div>
</header>

<style>

    .profile {
        width: 2.4rem;
        height: 2.4rem;
    }

    .bell {
        width: 2.2rem;
        height: 2.2rem;
    }

    .stats img {
        width: 0.2rem;
        height: 0.2rem;
    }

    .stat-value img {
        width: 1rem;
        height: 1rem;
    }

    .player-name {
        font-size: 0.9rem;
        font-weight: 600;
    }

    .user-info-div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        gap: 0.3rem;
    }

    .user-icon-info-div {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
    }

    .user-info {
        display: flex;
        gap: 0.8rem;
    }

    .stats {
        width: min-content;
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
    }

    .stat-value {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
        color: var(--color-text-gray);
        font-size: 0.7rem;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-weight: 600;
        color: var(--color-text-gray);
    }

    .logo p {
        font-size: 1rem;
    }

    .logo img {
        width: 2.2rem;
        height: 2.2rem;
    }

    .header-div {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.4rem;
        border-bottom: 0.0625rem solid var(--color-border);
    }

    div {
        background-color: var(--color-bg-0);
    }

    header {
        display: flex;
        justify-content: space-between;
    }

    nav {
        display: flex;
        justify-content: center;
    }

    ul {
        display: flex;
        gap: 3rem;
        list-style: none;
    }

    nav button {
        display: flex;
        align-items: center;
        color: var(--color-text-gray);
        font-weight: 500;
        font-size: 1rem;
        transition: color 0.2s linear;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    nav button:hover {
        color: var(--color-theme-1);
    }

    li[aria-current='page'] button {
        color: var(--color-theme-1);
        font-weight: 600;
    }
</style>