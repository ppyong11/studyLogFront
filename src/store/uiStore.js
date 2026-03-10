// store/uiStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware"; // 자동으로 localStorage 저장

export const useUIStore = create(
    persist(
        (set) => ({
            // 알림 모달
            isNotificationOpen: false,
            toggleNotification: () =>
                set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),
            

            // 사이드바 (여러 컴포넌트에서 사이드바 상태 공유)
            isSidebarOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

            // 계획 열람 방식 (zustand + localStorage)
            viewType: "grid",
            calendarViewMode: "monthly", //monthly, weekly
            isViewTypeReady: false, // 기본값으로 api 안 날아가게 방지

            setViewType: (type) => {
                set({ viewType: type });
            },
            
            setCalendarViewMode: (mode) => {
                set({ calendarViewMode: mode });
            },

            initViewType: () => {
                set({ isViewTypeReady: true });
            },
        }),
        { // 변수 골라서 persist
            name: "ui-store",
            // state: 현재 zustand 전체 상태
            partialize: (state) => ({
                // 이 두가지만 localStorage에 저장 (기본은 state 모든 값 저장)
                viewType: state.viewType,
                calendarViewMode: state.calendarViewMode,
            }),
        }
));
