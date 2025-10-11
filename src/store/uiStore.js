// store/uiStore.js
import { create } from "zustand";

export const useUIStore = create((set) => ({
    // 알림 모달
    isNotificationOpen: false,
    toggleNotification: () =>
        set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),
    

    // 사이드바
    isSidebarOpen: false,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
