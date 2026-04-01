"use client";

import { create } from "zustand";
import api from "../utils/api/axios"; // 인터셉터 Api (토큰 갱신 여부 확인)
import { showToast } from "../utils/toastMessage";
import { useTimerStore } from "./TimerStore";
import { useNotificationStore } from "./NotificationStore";

export const authStore = create((set, get) => ({
    // state 초기 상태
    user: null,
    isChecking: true,
    hasChecked: false,
    refreshTimer: null,
    isRefreshing: false, 
    socketRefreshTrigger: 0,

    // action (state를 바꾸는 함수들)
    setUser: (user) => set({ user }),
    
    clearUser: () => {
        // 유저 정보 초기화
        set({ user: null, refreshTimer: null });

        // 타이머 모달 강제 종료
        // 타이머 스토어의 메서드를 직접 호출하여 상태를 깨끗이 비움
        useTimerStore.getState().closeFloating(); 
    },

    setChecking: (v) => set({ isChecking: v }),

    checkAuth: async () => {
        set({ isChecking: true });

        try {
            const res = await api.get('/auth/me'); // baseURL에 붙음                                                                                                                                                                                                                                                                                                                          );

            // 성공 기준
            set({ 
                user: res.data, 
                hasChecked: true,
                isChecking: false
            });
            return true;
        } catch (error) {
            if (error.response?.status === 401) {
                set({ user: null, isChecking: false, hasChecked: true });
                return;
            }
            console.error(error);
            set({ isChecking: false, hasChecked: true });
        }
    },

    logout: async () => {
        try{
            const res= await api.post('/logout');
            showToast(res.data.message);

            useNotificationStore.getState().disconnectSSE();
            get().clearUser();
        } catch (error){
            throw error;
        }
    },

    withdraw: async () => {
        try {
            const res = await api.post('/withdraw');
            showToast(res.data.message);

            useNotificationStore.getState().disconnectSSE();
            get().clearUser();
        } catch (error){
            throw error;
        }
    },

    // 로그인 성공 시 호출할 함수
    setLoginSuccess: (userData, expiresInSeconds) => {
        localStorage.setItem('wasLogedIn', 'true');
        
        // 기존 타이머 전부 제거
        const existing = get().refreshTimer;
        if (existing) clearTimeout(existing);

        set({ user: userData, refreshTimer: null }); // null로 초기화 먼저

        const timeToRefresh = (expiresInSeconds - 60) * 1000;
        
        // 음수 방지 (토큰이 거의 만료됐을 때 즉시 루프 방지)
        if (timeToRefresh <= 0) {
            console.warn("토큰 만료 임박, 갱신 스킵");
            return;
        }

        const timerId = setTimeout(() => {
            get().silentRefresh();
        }, timeToRefresh);

        set({ refreshTimer: timerId });
    },


    // 자동으로 조용히 토큰을 다시 받아오는 함수
    silentRefresh: async () => {
        // 실행 전 타이머 ID를 즉시 null로 - 중복 실행 원천 차단
        set({ refreshTimer: null });

        if (!get().user) return;
        
        // isChecking 대신 별도 플래그로 관리
        if (get().isRefreshing) return;
        set({ isRefreshing: true });

        try {
            console.log("토큰 자동 갱신 시작");
            const res = await api.post('/refresh', {}, { withCredentials: true });
            const expiresIn = res.data.tokenExpiresIn;

            // 다시 로그인 갱신 (타이머 재설정됨)
            get().setLoginSuccess(get().user, expiresIn);
            
            // triggerSocketRefresh는 딜레이 후 실행
            setTimeout(() => get().triggerSocketRefresh(), 200);

        } catch (error) {
            console.error("자동 갱신 실패");
            get().clearUser();
        } finally {
            set({ isRefreshing: false });
        }
    },

    // 소켓 재연결용 신호기 (초기값 0)
    socketRefreshTrigger: 0, 
    // 이 함수를 부르면 숫자가 1씩 올라감
    triggerSocketRefresh: () => set((state) => ({ socketRefreshTrigger: state.socketRefreshTrigger + 1 })),
}));