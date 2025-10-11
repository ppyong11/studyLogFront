import { useEffect, useState, useRef } from "react";
import { useUIStore } from "../store/uiStore";

export function NotificationModal() {
    console.log("모달");
    const isOpen = useUIStore((state) => state.isNotificationOpen); //모달 상태
    const toggle= useUIStore((state) => state.toggleNotification); //toggle 변수가 함수 참조 (NotificationOpen 상태 변경 함수)
    const modalRef= useRef(); //모달 DOM 요소 참조

    const [notifications, setNotifications] = useState([
    { id: 1, message: "테스트 알림 1" },
    { id: 2, message: "테스트 알림 2" },
]);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // "all" or 개별 id

    const isTest= true;

    //SSE 연결 useEffect
    useEffect(() => {
        if (!isOpen || isTest) return; // 모달이 열릴 때만 SSE 연결

        const eventSource = new EventSource("/api/notifications/sse");

        eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev]); // 새 알림 추가
        };

        return () => eventSource.close(); // 모달 닫히면 연결 종료
    }, [isOpen]);

    //외부 클릭 감지 (모달 열렸을 때만 작용)
    useEffect(() => {
        if (!isOpen) return; //모달 닫힌 경우
        if(showDeletePopup) return; //팝업 활성화 경우 감지 비활성화
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                toggle(); // 모달 외부 클릭 시 닫기
            }
        }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, [isOpen, toggle, showDeletePopup]);

    // 전체 삭제 버튼
    const handleDeleteAll = () => {
        console.log("전체 삭제 핸들러");
        setShowDeletePopup(true);
        setDeleteTarget("all"); // 팝업에서 구분 가능하도록 상태 추가
    };

    // 개별 삭제 버튼
    const handleDeleteOne = (id) => {
        console.log("개별 삭제 핸들러");
    setShowDeletePopup(true);
    setDeleteTarget(id); // 어떤 알림을 지울지 저장
    };

    //팝업에서 예 클릭
    const confirmDelete = () => {
        if (deleteTarget === "all") {
            setNotifications([]); // 전체 삭제
        } else {
            setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget));
        }
        setShowDeletePopup(false);
    };

    // 팝업에서 아니오 클릭
    const cancelDelete = () => {
        setShowDeletePopup(false);
    };

    return (
        <>
        <div ref={modalRef} className="absolute top-full rounded-md right-0 mt-2 w-90 bg-white shadow-lg z-[100] border border-gray-200">
            {/* 모달에 전체 동작 버튼 추가 */}
            <div className="p-1 flex justify-start items-center">
                <button
                className="px-2 font-bold text-sm text-gray-400 rounded hover:text-gray-800"
                onClick={() => console.log("모두 확인")}
                >
                모두 읽음 처리
                </button>
                <span className="text-gray-300">|</span>
                <button
                    className="px-2 py-1 font-bold text-sm text-gray-400 rounded hover:text-gray-800"
                    onClick={handleDeleteAll}
                >
                    전체 삭제
                </button>
            </div>
            {notifications.length === 0 ? (
                <p className="p-2 text-gray-500">알림이 없습니다.</p>
            ) : (
                notifications.map((item, idx) => (
                <div key={idx} className="p-2 border-b border-b-gray-300 last:border-none flex justify-between items-center">
                    <span>{item.message}</span>
                    {/* 각 알림에 버튼 추가 */}
                    <button
                    className="text-sm text-blue-500 hover:underline"
                    onClick={() => handleDeleteOne(item.id)}
                    >
                    삭제
                    </button>
                </div>
                ))
            )}
    </div>
    {/* 팝업 표시 */}
    {showDeletePopup &&
    (deleteTarget === "all" ? (
        <DeleteAllPopup onConfirm={confirmDelete} onCancel={cancelDelete} />
        ) : (
        <DeleteOnePopup onConfirm={confirmDelete} onCancel={cancelDelete} />
    ))}
    </>
    );
}
//전체 삭제 확인 팝업 컴포넌트
const DeleteAllPopup = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4"> 알림 전체 삭제</h3>
            <p className="text-sm text-gray-600 mb-6">알림을 모두 삭제하시겠습니까?</p>
            <div className="flex justify-end space-x-4">
                <button
                    onClick={onCancel}
                    className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                    아니오
                </button>
                <button
                    onClick={onConfirm}
                    className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    예
                </button>
            </div>
        </div>
    </div>
);

//일부 삭제 확인 팝업 컴포넌트
const DeleteOnePopup = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <p className="text-sm text-gray-600 mb-6">해당 알림을 삭제하시겠습니까?</p>
            <div className="flex justify-end space-x-4">
                <button
                    onClick={onCancel}
                    className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                    아니오
                </button>
                <button
                    onClick={onConfirm}
                    className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    예
                </button>
            </div>
        </div>
    </div>
);