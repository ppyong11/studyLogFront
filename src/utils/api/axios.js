import axios from 'axios';
import { showToast } from '../toastMessage';
import { authStore } from '../../store/authStore';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    timeout: 5000,
});

let isLoggingOut = false; 

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. 로그인/리프레시 API 자체 에러는 무시
        if (originalRequest.url.includes('/login') || originalRequest.url.includes('/refresh')) {
            return Promise.reject(error);
        }

        // 2. 401 에러 처리
        if (error.response?.status === 401) {
            
            // 로그인한 유저가 아니면 알림 무시 *!!: 어떤 타입이든 boolean으로 바꿈
            const isUserLoggedIn = !!authStore.getState().user;
            if (!isUserLoggedIn) {
                return Promise.reject(error);
            }

            // 이미 로그인 페이지나 홈(/)에 있다면 강제 이동 및 알림 무시
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath === '/login' || currentPath === '/') {
                    return Promise.reject(error);
                }
            }

            // 진짜로 세션이 만료되어 튕겨야 하는 경우
            if (isLoggingOut) return Promise.reject(error);
            isLoggingOut = true;
            
            authStore.getState().clearUser();
            showToast("세션이 만료되었습니다.", "error");
            
            window.location.replace('/login'); 
            
            setTimeout(() => { isLoggingOut = false; }, 2000);
            
            return Promise.reject(error);
        }
        if (error.response?.status >= 500) {
            showToast("서버에 문제가 발생했습니다,", "error");
        }
        
        return Promise.reject(error);
    }
);

export default api;