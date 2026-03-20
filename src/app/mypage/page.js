"use client";

import { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react'; 
import { authStore } from '../../store/authStore';
import PasswordChangeModal from '../../components/myPage/PasswordChangeModal';
import NicknameChangeModal from '../../components/myPage/NicknameChangeModal';
import { useRouter } from 'next/navigation';
import { showToast } from '../../utils/toastMessage';
import WithdrawModal from '../../components/myPage/WithdrawModal';

// 메인 페이지 컴포넌트
export default function MyPage() {
    const { user, setUser } = authStore();
    const isChecking = authStore(state => state.isChecking);
    const hasChecked = authStore(state => state.hasChecked);
    const router = useRouter();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);

    // 초기 데이터 로드
    useEffect(() => {
        if (!hasChecked || isChecking || !user) return;
        
        // 유저 있으면 프로필 사진 설정
        // setPreviewImage(user.profileImage || null);
    }, [user, hasChecked, isChecking]);

    // UX용 막기
    useEffect(() => {
        if (!hasChecked || isChecking) return; // 한 번의 로그인 검사도 안 했거나 확인 중일때
        if (!user) {// 로그인 확인 끝났지만 유저 없으면 로그인창 이동
            showToast("로그인 후 이용해 주세요", "error");
            router.replace('/login');
        }
    }, [hasChecked, isChecking, user, router]);

    // 닉네임 변경 성공 시 콜백
    const handleNicknameSuccess = (newNickname) => {
        setUser({ ...user, nickname: newNickname });
    };

    // 로그인 확인 전에는 렌더링 막기 (화면 자체가 안 그려짐)
    if (!hasChecked || isChecking) {
        return <div className="flex justify-center p-10">로딩 중...</div>;
    }
    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">마이페이지</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* 상단 프로필 */}
                <div className="p-8 flex flex-col items-center border-b border-gray-100 bg-gray-50/50">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                        {previewImage ? (
                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-gray-400" />
                        )}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-gray-800">{user.nickname} 님</p>
                </div>

                {/* 폼 영역 */}
                <div className="p-8 space-y-8">
                    {/* 아이디 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1.5">아이디</label>
                        <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
                            {user.userId}
                        </div>
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                <span>••••••••••••</span>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(true)} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                                비밀번호 변경
                            </button>
                        </div>
                    </div>

                    {/* 닉네임 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">닉네임</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="w-full pl-3 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                                    {user.nickname}
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsNicknameModalOpen(true)} 
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap"
                            >
                                변경
                            </button>
                        </div>
                    </div>

                    {/* 이메일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                        <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
                            {user.email}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex pt-2">
                <button  
                    onClick={() => {
                        setIsWithdrawModalOpen(true); 
                    }} 
                    className="px-4 py-2 text-gray-400 text-sm font-medium hover:text-blue-600 transition-colors whitespace-nowrap outline-none"
                >
                    회원 탈퇴
                </button>
                
            </div>

            <WithdrawModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            />

            <PasswordChangeModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
            
            <NicknameChangeModal 
                isOpen={isNicknameModalOpen} 
                onClose={() => setIsNicknameModalOpen(false)}
                currentNickname={user.nickname}
                onSuccess={handleNicknameSuccess}
            />
        </div>
    );
}