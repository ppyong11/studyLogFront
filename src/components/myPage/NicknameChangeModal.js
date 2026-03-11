"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react'; 
import { showToast } from '../../utils/toastMessage';
import api from '../../utils/api/axios';

// 닉네임 변경 모달
export default function NicknameChangeModal({ isOpen, onClose, currentNickname, onSuccess }) {
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