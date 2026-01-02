import { writable, get } from 'svelte/store';
import bell from '$lib/images/bell.svg';
import graph_support from '$lib/images/graph-support.svg'
import ver_graph from '$lib/images/ver-graph.svg'
import graph from '$lib/images/graph.svg'
import quest from '$lib/images/quest.svg'
import document from '$lib/images/document.svg'

export type SidebarItem = {
    name: string;
    img: string;
    link: string;
};

export const sidebarConfigs = {
    dashboard: [
        { name: "통합 현황", img: graph_support, link: "/dashboard/overview" },
        { name: "은행", img: ver_graph, link: "/dashboard/bank" },
        { name: "주식", img: graph, link: "/dashboard/stock" },
        { name: "채권", img: quest, link: "/dashboard/bond" },
        { name: "코인", img: document, link: "/dashboard/coin" },
        { name: "ETF", img: bell, link: "/dashboard/etf" }
    ],
    asset: [
        { name: "전체 자산 개요", img: bell, link: "/asset/overview" },
        { name: "고급 차량", img: bell, link: "/asset/vehicles" },
        { name: "전용기", img: bell, link: "/asset/jet" },
        { name: "요트", img: bell, link: "/asset/yacht" },
        { name: "개인 부동산", img: bell, link: "/asset/realestate" },
        { name: "럭셔리 컬렉션", img: bell, link: "/asset/luxury" },
        { name: "특별 자산", img: bell, link: "/asset/special" }
    ],
    business: [
        { name: "대시보드", img: bell, link: "/business/dashboard" },
        { name: "세계 정세", img: bell, link: "/business/world" }
    ],
    leaderboard: [
        { name: "글로벌 랭킹", img: bell, link: "/leaderboard/global" },
        { name: "로컬 랭킹", img: bell, link: "/leaderboard/local" },
        { name: "친구 랭킹", img: bell, link: "/leaderboard/friends" }
    ]
};

export type SectionType = keyof typeof sidebarConfigs;

export const sectionOrder: SectionType[] = ['dashboard', 'asset', 'business', 'leaderboard'];

export const currentSection = writable<SectionType>('dashboard');
export const sidebarItems = writable<SidebarItem[]>(sidebarConfigs.dashboard);
export const selectedIndex = writable<number>(0);
export const transitionDirection = writable<number>(1);

export function updateSection(section: SectionType, direction?: number) {
    // direction이 제공되지 않은 경우에만 계산
    if (direction === undefined) {
        const current = get(currentSection);
        const currentIndex = sectionOrder.indexOf(current);
        const newIndex = sectionOrder.indexOf(section);
        direction = newIndex > currentIndex ? 1 : -1;
    }

    transitionDirection.set(direction);
    currentSection.set(section);
    sidebarItems.set(sidebarConfigs[section]);
    selectedIndex.set(0);
}