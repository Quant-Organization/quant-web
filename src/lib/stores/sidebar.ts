import { writable, get } from 'svelte/store';
import bell from '$lib/images/bell.svg';
import graph_support from '$lib/images/graph-support.svg'
import ver_graph from '$lib/images/ver-graph.svg'
import graph from '$lib/images/graph.svg'
import quest from '$lib/images/quest.svg'
import document from '$lib/images/document.svg'

import dashTotal from '$lib/images/dashboard_sidebar/total.svg'
import dashBank from '$lib/images/dashboard_sidebar/bank.svg'
import dashStock from '$lib/images/dashboard_sidebar/stock.svg'
import dashCoin from '$lib/images/dashboard_sidebar/coin.svg'
import dashBond from '$lib/images/dashboard_sidebar/bond.svg'
import dashEtf from '$lib/images/dashboard_sidebar/etf.svg'
import dashPortfolio from '$lib/images/dashboard_sidebar/portfolio.svg'

import assetTotal from '$lib/images/asset_sidebar/total.svg'
import assetCar from '$lib/images/asset_sidebar/car.svg'
import assetPlane from '$lib/images/asset_sidebar/plane.svg'
import assetYacht from '$lib/images/asset_sidebar/yacht.svg'
import assetEstate from '$lib/images/asset_sidebar/estate.svg'
import assetLuxury from '$lib/images/asset_sidebar/luxury.svg'

import globalIcon from '$lib/images/global.svg'

import bizStatus from '$lib/images/business_sidebar/company-status.svg'
import bizFactory from '$lib/images/business_sidebar/factory.svg'
import bizRnd from '$lib/images/business_sidebar/rnd.svg'

export type SidebarItem = {
    name: string;
    img: string;
    link: string;
};

export const sidebarConfigs = {
    dashboard: [
        { name: "통합 현황", img: dashTotal, link: "/dashboard/overview" },
        { name: "포트폴리오", img: dashPortfolio, link: "/dashboard/portfolio" },
        { name: "은행", img: dashBank, link: "/dashboard/bank" },
        { name: "주식", img: dashStock, link: "/dashboard/stock" },
        { name: "채권", img: dashBond, link: "/dashboard/bond" },
        { name: "코인", img: dashCoin, link: "/dashboard/coin" },
        { name: "ETF", img: dashEtf, link: "/dashboard/etf" }
    ],
    asset: [
        { name: "전체 자산 개요", img: assetTotal, link: "/asset/overview" },
        { name: "고급 차량", img: assetCar, link: "/asset/vehicles" },
        { name: "전용기", img: assetPlane, link: "/asset/jet" },
        { name: "요트", img: assetYacht, link: "/asset/yacht" },
        { name: "개인 부동산", img: assetEstate, link: "/asset/realestate" },
        { name: "럭셔리 컬렉션", img: assetLuxury, link: "/asset/luxury" }
    ],
    business: [
        { name: "대시보드", img: assetTotal, link: "/business/dashboard" },
        { name: "국제 정세", img: globalIcon, link: "/business/world" }
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
        { name: "기업 현황", img: bizStatus, link: `/business/company/${companyId}/overview` },
        { name: "공장 관리", img: bizFactory, link: `/business/company/${companyId}/factory` },
        { name: "R&D센터", img: bizRnd, link: `/business/company/${companyId}/rnd` },
        { name: "유통 및 판매", img: globalIcon, link: `/business/company/${companyId}/distribution` }
    ]);
}