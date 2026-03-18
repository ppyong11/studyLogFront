"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from "../store/uiStore";
import { NotificationModal } from './NotificationModal';
import { useNotificationStore } from "../store/NotificationStore";
import { ConfirmModal } from "./common/ConfirmModal";
import { authStore } from "../store/authStore";

import Link from 'next/link';
import logo from "../assets/logo.png";
import hamburger from "../assets/hamburger.png";
import { Bell } from "lucide-react"; 
import profile from "../assets/profile.png";
import xbutton from "../assets/multiply.png";
import Image from "next/image"; 
import { showToast } from "../utils/toastMessage";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const { user, isChecking, hasChecked, logout } = authStore();

    const { unreadCount, fetchUnreadCount, addNotificationFromSSE } = useNotificationStore();    
    const toggleNotification= useUIStore((state) => state.toggleNotification);
    const isNotificationOpen = useUIStore((state) => state.isNotificationOpen); //모달 상태

    const toggleSidebar= useUIStore((state) => state.toggleSidebar);
    const isSidebarOpen= useUIStore((state) => state.isSidebarOpen);

    const isAuthPage = pathname === '/signup' || pathname === '/login';

    const [isShowLogoPopup, setShowLogoPopup] = useState(false);
    const [isShowLogoutModal, setShowLogoutModal ]= useState(false);

    // Hydration Error 방지를 위한 마운트 상태 체크
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

        useEffect(() => {
        if (!user) return;
        
        //앱 진입 시 개수만 조회 (빨간 점 띄우기 위함)
        fetchUnreadCount();

        //SSE 연결 (실시간 개수 증가용)
        const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/sse/subscribe`;
        const eventSource = new EventSource(sseUrl, { withCredentials: true });
        
        //이벤트 수신
        eventSource.addEventListener("plan-completed", (event) => {
            try {
                const data = JSON.parse(event.data);

                console.log("이벤트 수신");
                showToast(data.title, "info");

                // 스토어 업데이트
                addNotificationFromSSE(data);
            } catch(error) {
                console.error("데이터 파싱 에러:", error);
            }
        });

        eventSource.addEventListener("subscribe-event", (event) => {
            console.log("연결 확인:", event.data);
        });

        eventSource.onerror = (error) => {
            // 에러 처리
            eventSource.close();
        };

        return () => eventSource.close();
    }, [user]);

    const hideSidebar = pathname === "/login" || pathname === "/signup";

    const menuItems= [
        { name: "메인페이지", path: "/" },
        { name: "타이머 관리", path: "/timers" },
        { name: "게시판", path: "/boards" },
        { name: "마이페이지", path: "/myPage" },
    ];

    const renderUserSection = () => {
        // 마운트 전에는 아무것도 렌더링하지 않음 (서버/클라이언트 불일치 방지)
        if (!mounted) return null;
        if (isAuthPage) return null;

        // 인증 확인 중일 때는 로그인 버튼 대신 스켈레톤(또는 빈 화면) 렌더링
        if (isChecking || !hasChecked) {
            return (
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-5 bg-gray-200 animate-pulse rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full"></div>
                </div>
            );
        }

        // 인증 확인이 끝났고 유저가 있을 때
        if (user) {
            return (
                <div className="flex items-center space-x-4">
                    {/* 닉네임 링크 */}
                    <Link href="/mypage" className="text-sm font-bold text-gray-700 hover:text-indigo-600">
                        {user.nickname} 님
                    </Link>
        
                    {/* 알림 영역 (버튼+배지+모달) */}
                    <div className="relative">
                        <button 
                            onMouseDown={(e) => {
                                e.stopPropagation(); 
                                toggleNotification();
                            }}
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <Bell className="w-6 h-6 text-gray-600" />
                            
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white transform translate-x-1 -translate-y-1">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {isNotificationOpen && <NotificationModal />}
                    </div>
                </div>
            );
        }

        // 인증 확인 끝났는데 유저 없을 때
        return (
            <div className="flex items-center space-x-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600">로그인</Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">회원가입</Link>
            </div>
        );
    };

    const handleLogout = async (e) => {
        e.preventDefault(); 

        try {
            await logout();
            
            router.push('/');
            toggleSidebar();
        } catch (error) {
            if (error.response) {
                showToast(error.response.data.message, "error");
            } else {
                console.log(error);
                showToast("서버에 연결되지 않습니다.", "error");
            } 
        }
    };


    return (
        <>  {/* <header>, <> 한번 더 감쌈 */}
            {/* 여기에 둬야 전체 화면에 띄워짐 */}
            {isShowLogoutModal && (
                <ConfirmModal
                    title="로그아웃"
                    message="정말 로그아웃 하시겠습니까?"
                    onConfirm={() => {
                    logout();
                    console.log("로그아웃 완료");
                    setShowLogoutModal(false);
                    }}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}
            {isShowLogoPopup && (
                <ConfirmModal
                    title="메인화면 이동"
                    message="작업 중인 내용이 모두 사라질 수 있습니다. 이동할까요?"
                    onConfirm={() => {
                        router.push('/');
                        setShowLogoPopup(false);
                    }}
                    onCancel={() => setShowLogoPopup(false)}
                    />
            )}
            <header className="flex items-center justify-between p-4 bg-white w-full flex-shrink-0 select-none shadow-sm">
                <div className="flex items-center space-x-4">
                    {/* 사이드바 가려야 되면 div로 위치 할당 (로고 위치 고정), 아니면 햄버거바 띄우기 */}
                    {hideSidebar ? (<div className="w-10" />) : 
                    (
                        <button id= "hamburger" className="p-2 rounded-md hover:bg-gray-100" onClick={toggleSidebar}>
                            <Image src= {hamburger} alt= "sideBar" width={24} height={24}/>
                        </button>
                    )}

                    <button 
                        onClick={ () => {
                            if (pathname === "/signup") {
                                setShowLogoPopup(true);
                            } else {
                                router.push("/");
                            }
                        }} className="flex items-center">
                        <Image src= {logo} alt= "메인페이지 이동" width={40} height={40}/>
                        <span className="ml-2 font-bold text-2xl">STUDY LOG</span>
                    </button>
                </div>


            {/* 로그인, 페이지 상태에 따라 우측에 렌더링 */}
            {renderUserSection()}
            </header>

            {/* 사이드바 - 헤더 밖에 위치 */}
            {isSidebarOpen && (
                <>
                    {/* 반투명 오버레이 */}
                    <div
                        className="fixed inset-0 z-20"
                        onClick={toggleSidebar} 
                    > </div>
                    <div
                        className="fixed top-0 left-0 h-full w-67 bg-white z-30 flex flex-col" 
                        style={{ boxShadow: "4px 0 6px -2px rgba(0,0,0,0.3)" }}
                        >
                        <div className="relative py-7 h-42 flex flex-col items-center mb-6 bg-green-100">
                            <Image src={xbutton} alt="닫는 버튼" width={25} height={25} 
                                className="absolute right-2 top-2 hover:bg-white/70"    
                                onClick={toggleSidebar}
                            />
                            
                            {/* 사이드바 내부 유저 정보도 마운트 체크 */}
                            {mounted && user ? (
                                <> 
                                    <Image src={profile} alt="프로필 사진" width={80} height={80} />
                                    <Link href="/mypage" className="pt-2 font-bold text-gray-700 hover:text-indigo-600">{user.nickname} 님</Link>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Link 
                                        href="/login"
                                        onClick={toggleSidebar}
                                        className="font-bold text-gray-700 hover:text-indigo-600">
                                            로그인 후 이용해 주세요.
                                    </Link>
                                </div>   
                            )}
                            
                            
                        </div>
                        {/* 단순 화면 이동, 로직 실행 X */}
                        <div className="px-4 flex flex-col space-y-2">
                            {menuItems.map(item => (
                                <Link
                                key={item.path}
                                href={item.path}
                                onClick={(e) => {
                                    toggleSidebar();
                                }}
                                className={`
                                    px-3 py-2 rounded-md transition-colors font-bold
                                    ${pathname === item.path ? "text-blue-600 font-bold" : "text-gray-600"}
                                    hover:bg-gray-100
                                `} 
                                > 
                                {item.name}
                                </Link>
                        ))}
                        </div>
                        {/* 로그아웃 버튼 - mounted 체크 */}
                        {mounted && user &&
                            <div className="mt-auto">
                                <button
                                onClick={handleLogout}
                                className="w-full px-3 py-2 rounded-md text-red-600 hover:bg-red-50 font-bold"
                                >
                                    로그아웃
                                </button>
                            </div>
                        }   
                    </div>
                </>
            )}
        </>
    );
}