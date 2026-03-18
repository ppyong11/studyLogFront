import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUIStore = create(
    persist(
        (set) => ({
            // 알림 모달
            isNotificationOpen: false,
            toggleNotification: () => set((state) => ({ 
                isNotificationOpen: !state.isNotificationOpen 
            })),

            // 사이드바
            isSidebarOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

            // 계획 열람 방식
            viewType: "grid",
            calendarViewMode: "monthly", // monthly, weekly
            isViewTypeReady: false,

            // 미완료 계획만 보기
            showOnlyIncomplete: false,

            setViewType: (type) => set({ viewType: type }),
            
            setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),

            // 미완료 토글 함수
            setShowOnlyIncomplete: (val) => set({ showOnlyIncomplete: val }),

            initViewType: () => set({ isViewTypeReady: true }),
        }),
        { 
            name: "ui-store",
            partialize: (state) => ({
                // localStorage에 저장할 항목들
                viewType: state.viewType,
                calendarViewMode: state.calendarViewMode,
                showOnlyIncomplete: state.showOnlyIncomplete,
            }),
        }
    )
);