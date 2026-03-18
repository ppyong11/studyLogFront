import { create } from "zustand";
import { showToast } from "../utils/toastMessage";
import api from "../utils/api/axios";

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    hasMore: true,
    isLoading: false,

    eventSource: null, // 연결 객체 보관용

    // SSE 실시간 연결 로직 (로그인 후 호출)
    connectSSE: () => {
        // 이미 연결되어 있으면 중복 연결 방지
        if (get().eventSource) return;

        // 서버가 계속해서 데이터를 넣어주는 스트리밍 방식이라 axios 못 씀 (eventSource 사용) 
        const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
        const sseUrl = `${baseURL}/api/notifications/subscribe`;

        // 쿠키 포함해서 요청
        const eventSource = new EventSource(sseUrl, {
            withCredentials: true 
        });

        // 서버에서 "notification"이라는 이름으로 데이터를 보냈을 때
        eventSource.addEventListener('notification', (event) => {
            try {
                const newNoti = JSON.parse(event.data);
                
                set((state) => {
                    const shouldAddToList = state.notifications.length > 0;
                    return {
                        unreadCount: state.unreadCount + 1,
                        notifications: shouldAddToList ? [newNoti, ...state.notifications] : state.notifications,
                        total: state.total + 1 
                    };
                });

                // 실시간 팝업 띄우기
                showToast("새로운 알림이 도착했습니다.", "info");
            } catch (error) {
                console.error("SSE 데이터 파싱 에러", error);
            }
        });

        // 에러 발생 시 (세션 만료 등)
        eventSource.onerror = (error) => {
            console.error("SSE 연결 에러 발생, 연결을 종료합니다.", error);
            eventSource.close();
            set({ eventSource: null });
        };

        set({ eventSource });
    },

    // SSE 연결 해제 (로그아웃 시 반드시 호출)
    disconnectSSE: () => {
        const { eventSource } = get();
        if (eventSource) {
            eventSource.close();
            set({ eventSource: null });
        }
    },

    // 안 읽은 개수만 가져오기 (Header에서 호출)
    fetchUnreadCount: async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            set({ unreadCount: res.data });
        } catch (error) {
            console.error("알림 개수 조회 실패", error);
        }
    },

    // 알림 리스트 가져오기 (페이징)
    fetchNotifications: async (page = 1) => {
        set({ isLoading: true });
        try {
            const res = await api.get(`/notifications?page=${page}`);
            const newData = res.data.content;
            const hasNext = res.data.hasNext; 
            const totalItems = res.data.totalItems;

            set((state) => ({
                // 1 페이지면 덮어쓰기, 아니면 뒤에 붙이기
                notifications: page === 1 ? newData : [...state.notifications, ...newData],
                page: page,
                total: totalItems,
                hasMore: hasNext,
                isLoading: false
            }));
        } catch (error) {
            console.error("알림 리스트 조회 실패", error);
            set({ isLoading: false });
        }
    },

    // 실시간 알림 도착
    addNotificationFromSSE: (newNoti) => {
        set((state) => {
            // 리스트를 아직 한 번도 안 불러왔으면(모달 안 열어봄), 개수만 늘림
            // 모달을 열어서 데이터가 있는 상태라면, 리스트 맨 앞에도 추가
            const shouldAddToList = state.notifications.length > 0;
            
            return {
                unreadCount: state.unreadCount + 1,
                notifications: shouldAddToList ? [newNoti, ...state.notifications] : state.notifications,
                totalItems: state.totalItems + 1
            };
        });
    },

    // 읽음 처리
    markAsRead: async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            set((state) => ({
                notifications: state.notifications.map(n => 
                    n.id === id ? { ...n, read: true } : n
                ),
                // 안 읽은 거였으면 개수 -1
                unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0
            }));
        } catch (error) {
            console.error(error);
            showToast("읽음 처리 실패", 'error');
        }
    },

    // 5. 전체 읽음
    markAllAsRead: async () => {
        try {
            await api.patch('/notifications/read-all');
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error(error);
            showToast("전체 읽음 처리 실패", 'error');
        }
    },

deleteNotification: async (id) => {
        // [낙관적 업데이트] API 응답 기다리지 않고 UI 먼저 수정
        set((state) => {
            // 이전 상태에서 계산 후 업데이트
            // 지우려는 알림 찾기
            const target = state.notifications.find((n) => n.id === id);

            // 혹시 데이터가 없으면 현재 상태 유지
            if (!target) return state;

            // 삭제 대상이 안 읽은 상태였는지 체크
            const isUnread = !target.read;

            return {
                // 리스트에서 해당 ID 제외
                notifications: state.notifications.filter((n) => n.id !== id),
                
                // 안 읽은 알림을 지우는 거라면 개수 -1 (0 밑으로는 안 내려가게 방어)
                unreadCount: isUnread 
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount,
                total: Math.max(0, state.total - 1) // 전역 상태 total 값 변경 (state.total은 기존 상태 값)
            };
        });

        // 서버 API 요청 (비동기)
        try {
            await api.delete(`/notifications/${id}`);
        } catch (error) {
            console.error("알림 삭제 실패:", error);
            showToast("알림 삭제 실패", 'error');
        }
    },
    
    deleteAllNotifications: async () => {
        try {
            await api.delete(`/notifications/`);
            set({ // 이전 상태 상관없이 새로운 값으로 대체 
                notifications: [], unreadCount: 0, total: 0 });
        } catch(e) {}
    }
}));