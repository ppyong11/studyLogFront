import { useEffect, useRef, useState } from "react";
import { useUIStore } from "../store/uiStore";
import { useNotificationStore } from "../store/NotificationStore";
import { ConfirmModal } from './common/ConfirmModal';
import { formatTimeAgo } from '../utils/dateUtils';
import { Trash2, CheckCheck, X, Bell } from "lucide-react"; // 아이콘 추가
import { showToast } from "../utils/toastMessage";

export function NotificationModal() {
    const isOpen = useUIStore((state) => state.isNotificationOpen);
    const toggle = useUIStore((state) => state.toggleNotification);
    
    const { 
        notifications, 
        fetchNotifications, 
        deleteNotification, 
        deleteAllNotifications,
        markAllAsRead,
        markAsRead, // 개별 읽음 처리 함수 필요
        total,
        page,
        hasMore,
        isLoading
    } = useNotificationStore();

    const modalRef = useRef();
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); 

    useEffect(() => {
        if (isOpen) {
            fetchNotifications(1); // 열릴 때 1페이지 로드
        }
    }, [isOpen]);

    // 외부 클릭 닫기
    useEffect(() => {
        if (!isOpen || showDeletePopup) return;
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                toggle();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, toggle, showDeletePopup]);

    // 핸들러들
    const handleDeleteAll = () => {
        setShowDeletePopup(true);
        setDeleteTarget("all");
    };

    const handleDeleteOne = (e, id) => {
        e.stopPropagation(); // 클릭 시 알림 읽음 처리(이동) 이벤트 방지
        setShowDeletePopup(true);
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        if (deleteTarget === "all") {
            if (total <= 0) {
                showToast("삭제할 알람이 없습니다.");
            }
            deleteAllNotifications();
        }
        else deleteNotification(deleteTarget);
        setShowDeletePopup(false);
    };

    const cancelDelete = () => setShowDeletePopup(false);
    
    // 더보기 핸들러
    const handleLoadMore = () => {
        if (!isLoading && hasMore) fetchNotifications(page + 1);
    };

    // 알림 클릭 (읽음 처리 및 이동 로직)
    const handleNotificationClick = (item) => {
        if (!item.read) markAsRead(item.notificationId || item.id);
        // router.push(item.url); // 필요 시 페이지 이동
    };

    if (!isOpen) return null;

    return (
        <>
        <div 
            ref={modalRef} 
            className="absolute top-full right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
        >
            {/* 1. 헤더 영역 */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-gray-800">알림</span>
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            {total}
                        </span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                        <CheckCheck className="w-3 h-3" />
                        모두 읽음
                    </button>
                    <div className="h-3 w-[1px] bg-gray-200"></div>
                    <button 
                        onClick={handleDeleteAll}
                        className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                        전체 삭제
                    </button>
                </div>
            </div>

            {/* 2. 리스트 영역 */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">새로운 알림이 없습니다.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((item) => (
                            <div 
                                key={item.notificationId || item.id} 
                                onClick={() => handleNotificationClick(item)}
                                className={"group relative p-4 cursor-pointer transition-all hover:bg-gray-50"}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    {/* 내용 섹션 */}
                                    <div className="flex-1 space-y-1">
                                        
                                        {/* 제목 + 날짜 + 파란점 영역 */}
                                        <div className="flex justify-between items-start">
                                            
                                            {/* [수정됨] 제목 옆에 파란 점 배치 */}
                                            <div className="relative pr-2">
                                                {!item.read && (
                                                    // 파란 점: 제목 높이에 맞춰 mt 조절
                                                    <span className="absolute -left-3 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                                <h4 className={"text-sm leading-tight font-medium text-gray-600"}>
                                                    {item.title || "알림"}
                                                </h4>
                                            </div>
                                            {/* 날짜 */}
                                            <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2 font-normal">
                                                {formatTimeAgo(item.alertAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                            {item.message || item.content}
                                        </p>
                                    </div>

                                    {/* 삭제 버튼 (Hover 시에만 등장) */}
                                    <button
                                        onClick={(e) => handleDeleteOne(e, item.notificationId || item.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. 더 불러오기 버튼 (리스트 최하단) */}
                {hasMore && notifications.length > 0 && (
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                        <button 
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            className="w-full py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    로딩 중...
                                </>
                            ) : (
                                '더 보기'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* 삭제 팝업 */}
        {showDeletePopup && (
            <ConfirmModal
                title={deleteTarget === "all" ? "전체 삭제" : "알림 삭제"}
                message={deleteTarget === "all" ? "모든 알림을 삭제하시겠습니까?" : "이 알림을 삭제하시겠습니까?"}
                onConfirm={confirmDelete} 
                onCancel={cancelDelete} 
            />
        )}
        </>
    );
}