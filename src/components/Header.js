'use client'

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '../store/uiStore';
import { NotificationModal } from './NotificationModal';
import Link from 'next/link';
import logo from "../assets/logo.png";
import hamburger from "../assets/hamburger.png";
import notification from "../assets/notification.png";
import Image from "next/image"; 

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const toggleNotification= useUIStore((state) => state.toggleNotification);
    const isOpen = useUIStore((state) => state.isNotificationOpen); //모달 상태

    const [isLogin, setIsLogin] = useState(true);
    const [nickname, setNickname] = useState('테스트 유저');

    const isAuthPage = pathname === '/signup' || pathname === '/login';

    const toggleSidebar = () => {
        console.log('사이드바 토글!');
    };

    const [isModalOpen, setIsModalOpen]= useState(false);
    const toggleModal = () => setIsModalOpen(prev => !prev); //isModalOpen 변수를 바꿀 수 없어서 새 객체를 참조하는 건가...

    const renderUserSection = () => {
        if (isAuthPage) return null;

        if (isLogin) {
        return (
            <div className="flex items-center space-x-4">
            <Link href="/mypage" className="text-sm font-medium text-gray-700 hover:text-indigo-600">{nickname} 님</Link>

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

    return (
        <header className="flex items-center justify-between p-4 border-b bg-white w-full flex-shrink-0">
        <div className="flex items-center space-x-4">
            <button id= "hamburger" className="p-2 rounded-md hover:bg-gray-100" onClick={toggleSidebar}>
                <Image src= {hamburger} alt= "sideBar" width={24} height={24}/>
            </button>

            <button onClick={() => router.push("/")} className="flex items-center">
                <Image src= {logo} alt= "메인페이지 이동" width={40} height={40}/>
                <span className="ml-2 font-bold text-2xl">STUDY LOG</span>
            </button>
        </div>

        {/* 로그인, 페이지 상태에 따라 우측에 렌더링 */}
        {renderUserSection()}
        </header>
    );
}
