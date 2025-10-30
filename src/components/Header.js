'use client'

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '../store/uiStore';
import { NotificationModal } from './NotificationModal';
import { ConfirmModal } from './common/modals/ConfirmModal';

import Link from 'next/link';
import logo from "../assets/logo.png";
import hamburger from "../assets/hamburger.png";
import notification from "../assets/notification.png";
import profile from "../assets/profile.png";
import xbutton from "../assets/multiply.png";

import Image from "next/image"; 

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const toggleNotification= useUIStore((state) => state.toggleNotification);
    const isOpen = useUIStore((state) => state.isNotificationOpen); //모달 상태

    const toggleSidebar= useUIStore((state) => state.toggleSidebar);
    const isSidebarOpen= useUIStore((state) => state.isSidebarOpen);

    const [isLogin, setIsLogin] = useState(true);
    const [nickname, setNickname] = useState('테스트 유저');

    const isAuthPage = pathname === '/signup' || pathname === '/login';

    const [isModalOpen, setIsModalOpen]= useState(false);
    const toggleModal = () => setIsModalOpen(prev => !prev); //isModalOpen 변수를 바꿀 수 없어서 새 객체를 참조하는 건가...

    const [isShowLogoPopup, setShowLogoPopup] = useState(false);

    const [isShowLogoutModal, setShowLogoutModal ]= useState(false);

    const hideSidebar = pathname === "/login" || pathname === "/signup";

    const menuItems= [
        { name: "메인페이지", path: "/" },
        { name: "계획 관리", path: "/plans" },
        { name: "타이머 관리", path: "/timers" },
        { name: "게시판", path: "/boards" },
        { name: "마이페이지", path: "/myPage" },
    ];

    const handleLogoClick = () => {
        setShowLogoPopup(true);
    }

    const renderUserSection = () => {
        if (isAuthPage) return null;

        if (isLogin) {
        return (
            <div className="flex items-center space-x-4">
            <Link href="/mypage" className="text-sm font-bold text-gray-700 hover:text-indigo-600">{nickname} 님</Link>

            <button onClick={toggleNotification} className="relative p-2 rounded-full hover:bg-gray-100">
                <Image src= {notification} alt= "알림 리스트" width={25} height={25} />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                {isOpen && <NotificationModal />}
            </button>
            </div>
        );
        } else {
        return (
            <div className="flex items-center space-x-2">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600">로그인</Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">회원가입</Link>
            </div>
        );
        }
    };

    const handleLogout = () => {
        /* 
        유효한 토큰인지 확인 (만료 토큰이라면 알아서 redirection + 이미 만료된 토큰입니다)
        실행된 타이머 없는지 (종료하고 다시 시도 팝업)
        다 백엔드에서 처리해주나..
        */
       setShowLogoutModal(true); //클릭 시 모달 상태 열림으로 변경
    }

    return (
        <>  {/* <header>, <> 한번 더 감쌈 */}
            {/* 여기에 둬야 전체 화면에 띄워짐 */}
            {isShowLogoutModal && (
                <ConfirmModal
                    title="로그아웃"
                    message="정말 로그아웃 하시겠습니까?"
                    onConfirm={() => {
                    // 실제 로그아웃 처리
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
            <header className="flex items-center justify-between p-4 bg-white w-full flex-shrink-0 select-none">
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
                            if (pathname !== "/login") {
                                handleLogoClick();
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
            {/* <div> 감쌈 */}
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
                        <div className="relative py-7 flex flex-col items-center mb-6 bg-green-100">
                            <Image src={xbutton} alt="닫는 버튼" width={25} height={25} 
                                className="absolute right-2 top-2 hover:bg-white/70"    
                                onClick={toggleSidebar}
                            />
                            <Image src={profile} alt="프로필 사진" width={80} height={80} />
                            <Link href="/mypage" className="pt-2 font-bold text-gray-700 hover:text-indigo-600">{nickname} 님</Link>
                        </div>
                        {/* 단순 화면 이동, 로직 실행 X */}
                        <div className="px-4 flex flex-col space-y-2">
                            {menuItems.map(item => (
                                <Link
                                key={item.path}
                                href={item.path}
                                onClick={toggleSidebar} //클릭하면 닫기
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
                        {/* 로그아웃 버튼 */}
                        <div className="mt-auto">
                            <button
                            onClick={handleLogout}
                            className="w-full px-3 py-2 rounded-md text-red-600 hover:bg-red-50 font-bold"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
