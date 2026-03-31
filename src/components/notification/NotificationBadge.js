import { useNotificationStore } from "../../store/NotificationStore";

export function NotificationBadge() {
    // unreadCount만 구독 (해당 데이터 바뀔 때 리렌더링)
    const unreadCount = useNotificationStore((state) => state.unreadCount);

    if (unreadCount <= 0) return null;

    return (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white transform translate-x-1 -translate-y-1">
            {unreadCount > 99 ? "99+" : unreadCount}
        </span>
    );
}