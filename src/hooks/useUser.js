import { authStore } from '../store/authStore'; 
import { useMounted } from './useMounted';

export function useUser() {
    const user = authStore((state) => state.user); // 원래 유저 가져오는 코드
    const isMounted = useMounted(); // 마운트 체크

      // 마운트 전이면 무조건 null 반환 (서버랑 똑같이 맞춤)
    if (!isMounted) {
        return null;
    }

    // 마운트 후에는 진짜 유저 정보 반환 (authStore의 User 객체)
    return user;
}