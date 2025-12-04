"use client";

import { useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from "../store/uiStore";
import { NotificationModal } from './NotificationModal';
import { ConfirmModal } from "./common/modals/ConfirmModal";
import { authStore } from "../store/authStore";
import { useUser } from "../hooks/useUser";

import Link from 'next/link';
import logo from "../assets/logo.png";
import hamburger from "../assets/hamburger.png";
import notification from "../assets/notification.png";
import profile from "../assets/profile.png";
import xbutton from "../assets/multiply.png";
import Image from "next/image"; 
import axios from 'axios';

const apiUrl= process.env.NEXT_PUBLIC_API_URL;

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const user = useUser(); // 마운트 후 체크된 유저 객체
    
    const clearUser = authStore((state) => state.clearUser);

    const toggleNotification= useUIStore((state) => state.toggleNotification);
    const isOpen = useUIStore((state) => state.isNotificationOpen); //모달 상태

    const toggleSidebar= useUIStore((state) => state.toggleSidebar);
    const isSidebarOpen= useUIStore((state) => state.isSidebarOpen);

    const isAuthPage = pathname === '/signup' || pathname === '/login';

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
        console.log(pathname);
        if (pathname === '/signup') {
            setShowLogoPopup(true);
        }   
    }

    const renderUserSection = () => {
        if (isAuthPage) return null;

        if (user) {
        return (
            <div className="flex items-center space-x-4">
            <Link href="/mypage" className="text-sm font-bold text-gray-700 hover:text-indigo-600">{user.nickname} 님</Link>

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

    const handleLogout = async (e) => {
        e.preventDefault(); 
        
        try{
            const res= await axios.post(`${apiUrl}/logout`, {}, {
                withCredentials:true
            });
            
            alert(res.data.message);
            router.push('/');
            toggleSidebar();
        } catch (error){
            if (error.response) { //서버로부터 에러 응답 받음
                alert(error.response.data.message);
            } else { // 에러 응답이 안 온 상황 (서버 죽었거나 네트워크 문제, 프론트 문제) 
                alert(`서버에 연결되지 않습니다.`);
            } 
        } finally {
                clearUser();
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
                        <div className="relative py-7 h-42 flex flex-col items-center mb-6 bg-green-100">
                            <Image src={xbutton} alt="닫는 버튼" width={25} height={25} 
                                className="absolute right-2 top-2 hover:bg-white/70"    
                                onClick={toggleSidebar}
                            />
                            
                            {user ? (
                                <> {/* 요소를 반환하기 위해 추가 */}
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
                                    //로그인 x
                                    /*if (!user) {
                                        e.preventDefault(); // 페이지 이동 X (<Link> 태그 막음)
                                        alert("로그인 후 이용해 주세요.");
                                    } else {
                                        //로그인 상태면 이동 & 사이드바 닫기
                                        toggleSidebar();
                                    }*/
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
                        {/* 로그아웃 버튼 */}
                        {user &&
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
