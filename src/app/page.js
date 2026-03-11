"use client";

import { authStore } from "../store/authStore"; // 경로를 실제 환경에 맞게 수정하세요.
import LandingView from "../components/mainView/LandingView";
import DashboardView from "../components/mainView/DashBoardView";

export default function MainPage() {
    const { user, isChecking, hasChecked } = authStore();
    
    // 로컬스토리지에 징표가 있는지 확인 (브라우저 환경일 때만)
    const wasLoggedIn = typeof window !== "undefined" && localStorage.getItem('wasLoggedIn') === 'true';

    // 1. 로그인 한 적 없는 쌩 초보 유저는 바로 랜딩 페이지로! (스피너 X)
    if (!wasLoggedIn && !user && hasChecked) {
        return <LandingView />;
    }

    // 2. 로그인 한 적이 있는 유저인데 아직 서버 확인 중이라면? 
    if (wasLoggedIn && (!hasChecked || isChecking)) {
        return <DashboardView user={{ name: "불러오는 중..." }} isLoading={true} />;
    }

    // 3. 서버 확인이 끝났는데 유저가 없으면(토큰 만료 등) 랜딩 페이지로 쫓아냄
    if (!user) return <LandingView />;

    // 4. 정상 로드 완료
    return <DashboardView user={user} />;
}