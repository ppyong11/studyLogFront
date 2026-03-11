"use client";

import { authStore } from "../store/authStore"; // 경로를 실제 환경에 맞게 수정하세요.
import { Loader2 } from "lucide-react";
import LandingView from "../components/mainView/LandingView";
import DashboardView from "../components/mainView/DashBoardView";

export default function MainPage() {
    // 1. authStore에서 필요한 상태와 함수들을 꺼내옵니다.
    const { user, isChecking } = authStore();

    // 3. 백엔드와 통신하며 토큰을 확인하는 동안 보여줄 로딩 화면입니다.
    if (isChecking) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">로그인 상태를 확인하고 있습니다...</p>
            </div>
        );
    }

    // 4. 확인이 끝났는데 유저 정보가 없다면 랜딩 페이지를 보여줍니다.
    if (!user) {
        return <LandingView />;
    }

    // 5. 유저 정보가 있다면 대시보드(계획창)를 보여줍니다.
    return <DashboardView user={user} />;
}