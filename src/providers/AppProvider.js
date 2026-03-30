"use client";

import { authStore } from "../store/authStore";
import { useEffect } from "react";

export function AppProvider({ children }) {
    const { hasChecked, checkAuth } = authStore.getState(); // 구독 말고 getState() *상태 바뀌어도 리렌더링 X    

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

    return children;
}
