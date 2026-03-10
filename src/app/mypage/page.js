"use client";

import { useState, useEffect } from 'react';
import { User, Lock, X, Check } from 'lucide-react'; 
import { authStore } from '../../store/authStore';
import { showToast } from '../../utils/toastMessage';
import api from '../../api/axios';

// --- [모달 1] 비밀번호 변경 모달 ---
const PasswordChangeModal = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (isOpen) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validate = (name, value) => {
        let error = '';
        switch (name) {
            case 'currentPassword':
                if (!/^[a-zA-Z0-9]{6,20}$/.test(value)) {
                    error = '비밀번호는 6~20자 영문 또는 숫자여야 합니다.';
                }
                break;
            case 'newPassword':
                if (!/^[a-zA-Z0-9]{6,20}$/.test(value)) {
                    error = '비밀번호는 6~20자 영문 또는 숫자여야 합니다.';
                }
                break;
            case 'confirmPassword':
                if (value !== newPassword) {
                    error = '비밀번호가 일치하지 않습니다.';
                }
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'currentPassword') {
            setCurrentPassword(value);
            validate('currentPassword', value);
        }
        if (name === 'newPassword') {
            setNewPassword(value);
            validate('newPassword', value);
            if (confirmPassword) {
                if (value !== confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
                } else {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
            }
        }
        if (name === 'confirmPassword') {
            setConfirmPassword(value);
            if (value !== newPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
            } else {
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
        }
    };

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("모든 항목을 입력해 주세요.", "error"); return;
        }
        if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
            showToast("입력 정보를 확인해 주세요.", "error"); return;
        }

        try {
            await api.patch('/member/change-pw', { currentPassword, newPassword });
            showToast("비밀번호가 변경되었습니다.");
            onClose();
        } catch (error) {
            showToast(error.response?.data?.message || "비밀번호 변경 실패", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">비밀번호 변경</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <input 
                            type="password" 
                            name="currentPassword"
                            placeholder="현재 비밀번호" 
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.currentPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`} 
                            value={currentPassword} 
                            onChange={handleChange} 
                        />
                        {errors.currentPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.currentPassword}</p>}
                    </div>
                    <div>
                        <input 
                            type="password" 
                            name="newPassword"
                            placeholder="새 비밀번호 (6~20자 영문/숫자)" 
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.newPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`} 
                            value={newPassword} 
                            onChange={handleChange} 
                        />
                        {errors.newPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.newPassword}</p>}
                    </div>
                    <div>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            placeholder="새 비밀번호 확인" 
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`} 
                            value={confirmPassword} 
                            onChange={handleChange} 
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border-gray-300 border rounded-md hover:bg-gray-100">취소</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">변경하기</button>
                </div>
            </div>
        </div>
    );
};

// --- [모달 2] 닉네임 변경 모달 (수정됨) ---
const NicknameChangeModal = ({ isOpen, onClose, currentNickname, onSuccess }) => {
    const [newNickname, setNewNickname] = useState("");
    // 에러 메시지를 담을 상태 하나만 사용 (비밀번호 모달처럼)
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setNewNickname(currentNickname || "");
            setError("");
        }
    }, [isOpen, currentNickname]);

    // 유효성 검사 함수
    const validate = (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return "닉네임을 입력해주세요.";
        }
        if (trimmed.length < 2 || trimmed.length > 10) {
            return "닉네임은 2~10자여야 합니다.";
        }
        if (trimmed === currentNickname) {
            return "현재 사용 중인 닉네임입니다.";
        }
        return "";
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setNewNickname(value);
        
        // 입력할 때마다 실시간 유효성 검사 후 에러 표시
        const validationMsg = validate(value);
        if (validationMsg && validationMsg !== "현재 사용 중인 닉네임입니다.") {
             // 현재 닉네임과 같은 건 입력 중엔 에러로 안 띄우고 싶다면 조건 추가 가능
             // 여기선 그냥 모든 에러 다 띄움
            setError(validationMsg);
        } else {
            setError("");
        }
    };

    const handleSubmit = async () => {
        // 1. 제출 전 클라이언트 유효성 검사
        const validationError = validate(newNickname);
        if (validationError) {
            setError(validationError); // 에러 메시지 빨간색으로 표시
            showToast(validationError, "error");
            return;
        }

        try {
            // 2. 서버 요청 (중복이면 여기서 에러 발생)
            const res = await api.patch('/member/change-nickname', { nickname: newNickname });
            
            showToast("닉네임이 변경되었습니다.");
            console.log(res.data.data);
            onSuccess(res.data.data);
            onClose();

        } catch (err) {
            // 3. 서버 에러 처리 (중복 닉네임 등)
            const serverMsg = err.response?.data?.message || "닉네임 변경 실패";
            setError(serverMsg); // 인풋 밑에 빨간 글씨로 띄움
            showToast(serverMsg, "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">닉네임 변경</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-2">
                    {/* 중복 확인 버튼 삭제, 인풋창 꽉 차게 변경 */}
                    <div>
                        <input 
                            type="text" 
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
                            placeholder="닉네임 입력 (2~10자)"
                            value={newNickname}
                            onChange={handleChange}
                        />
                        {/* 에러 메시지 표시 영역 */}
                        {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">취소</button>
                    <button 
                        onClick={handleSubmit} 
                        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                        변경하기
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- [메인 페이지 컴포넌트] ---
export default function MyPage() {
    const { user, setUser } = authStore();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);

    // 초기 데이터 로드
    useEffect(() => {
        if (user) {
            setPreviewImage(user.profileImage || null);
        }
    }, [user]);

    console.log(user);

    // 닉네임 변경 성공 시 콜백
    const handleNicknameSuccess = (newNickname) => {
        setUser({ ...user, nickname: newNickname });
    };

    if (!user) return <div className="p-10 text-center">정보를 불러오는 중입니다...</div>;

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