"use client";

import { authStore } from "../store/authStore"; 
import LandingView from "../components/mainView/LandingView";
import PlanDashBoard from "../components/mainView/PlanDashBoard"; 
import { useMounted } from "../hooks/useMounted";

export default function MainPage() {
    const isMounted = useMounted();
    const { user, isChecking, hasChecked } = authStore();
    
    // 1. 하이드레이션 에러 방지
    if (!isMounted) return null;

    // 2. 로그인 확인 중일 때 (스피너)
    if (!hasChecked || isChecking) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // 3. 서버 확인이 끝났는데 유저가 없으면(토큰 만료 등) 랜딩 페이지로 쫓아냄
    if (!user) return <LandingView />;

    // 4. 정상 로드 완료
    return <PlanDashBoard />;
}