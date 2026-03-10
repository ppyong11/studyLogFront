"use client";

import { useEffect } from "react";
import { authStore } from "../store/authStore";
import { useTimerWebSocket } from "../hooks/timerWebSocket"; // 아까 만든 웹소켓 훅!

export default function AppLayout({ children }) {
    const { hasChecked, checkAuth } = authStore.getState(); // 구독 말고 getState() *상태 바뀌어도 리렌더링 X
    
    useTimerWebSocket();

    useEffect(() => {
            const initAuth = async () => {
                if (!hasChecked) {
                    try {
                        await checkAuth();
                    } catch (error) {
                        console.error("인증 체크 실패:", error);
                    }
                }
            };

            initAuth();
        }, []); 

    return <>{children}</>; 
}