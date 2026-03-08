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
        { name: "코인", img: document, link: "/dashboard/coin" },
        { name: "ETF", img: bell, link: "/dashboard/etf" }
    ],
    asset: [
        { name: "전체 자산 개요", img: bell, link: "/asset/overview" },
        { name: "고급 차량", img: bell, link: "/asset/vehicles" },
        { name: "전용기", img: bell, link: "/asset/jet" },
        { name: "요트", img: bell, link: "/asset/yacht" },
        { name: "개인 부동산", img: bell, link: "/asset/realestate" },
        { name: "럭셔리 컬렉션", img: bell, link: "/asset/luxury" }
    ],
    business: [
        { name: "대시보드", img: bell, link: "/business/dashboard" },
        { name: "국제 정세", img: bell, link: "/business/world" }
    ],
    leaderboard: [
        { name: "내 프로필", img: graph_support, link: "/leaderboard/profile" },
        { name: "리더보드", img: ver_graph, link: "/leaderboard/ranking" },
        { name: "미션", img: quest, link: "/leaderboard/mission" }
    ]
};

export type SectionType = keyof typeof sidebarConfigs;

export const sectionOrder: SectionType[] = ['dashboard', 'asset', 'business', 'leaderboard'];

export const currentSection = writable<SectionType>('dashboard');
export const sidebarItems = writable<SidebarItem[]>(sidebarConfigs.dashboard);
export const selectedIndex = writable<number>(0);
export const transitionDirection = writable<number>(1);
export const currentCompanyId = writable<string | null>(null);

export function updateSection(section: SectionType, direction?: number) {
    const current = get(currentSection);
    const companyId = get(currentCompanyId);
    
    // 같은 섹션이고 company 사이드바가 아니면 무시 (불필요한 애니메이션 방지)
    // company 사이드바인 경우 일반 섹션 사이드바로 되돌려야 함
    if (current === section && companyId === null) {
        return;
    }

    // direction이 제공되지 않은 경우에만 계산
    if (direction === undefined) {
        const currentIndex = sectionOrder.indexOf(current);
        const newIndex = sectionOrder.indexOf(section);
        direction = newIndex > currentIndex ? 1 : -1;
    }

    transitionDirection.set(direction);
    currentSection.set(section);
    sidebarItems.set(sidebarConfigs[section]);
    selectedIndex.set(0);
    currentCompanyId.set(null);
}

export function setCompanySidebar(companyId: string, companyName: string) {
    currentCompanyId.set(companyId);
    currentSection.set('business');
    sidebarItems.set([
        { name: "기업 현황", img: graph_support, link: `/business/company/${companyId}/overview` },
        { name: "공장 관리", img: ver_graph, link: `/business/company/${companyId}/factory` },
        { name: "R&D센터", img: graph, link: `/business/company/${companyId}/rnd` },
        { name: "유통 및 판매", img: document, link: `/business/company/${companyId}/distribution` }
    ]);
}