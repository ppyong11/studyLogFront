"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { authStore } from '../../store/authStore';
import { showToast } from '../../utils/toastMessage';

export default function WithdrawModal({ isOpen, onClose }) {
    const [isAgreed, setIsAgreed] = useState(false);
    const withdraw= authStore((s) => s.withdraw);

    // 모달이 닫힐 때마다 체크박스 초기화
    useEffect(() => {
        if (!isOpen) {
            setIsAgreed(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (isAgreed) {
            try {
                await withdraw();

                showToast("회원탈퇴 처리되었습니다.");
            } catch (error){
                if (error.response) { 
                    showToast(error.response.data.message, "error");
                } else {
                    showToast(`서버에 연결되지 않습니다.`, "error");
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        회원탈퇴
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 본문 */}
                <div className="p-6 space-y-6">
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm leading-relaxed">
                        <p className="font-semibold mb-2">정말로 스터디로그를 떠나시겠어요?</p>
                        <ul className="list-disc list-inside space-y-1 text-red-700/80">
                            <li>탈퇴 신청 후 <span className="font-bold">7일간의 유예 기간</span>이 주어집니다.</li>
                            <li>유예 기간 내에 <span className="font-bold underline">재로그인하시면 탈퇴가 취소</span>됩니다.</li>
                            <li>7일이 경과하면 모든 학습 기록과 정보가 영구 삭제되며 복구할 수 없습니다.</li>
                        </ul>
                    </div>

                    {/* 동의 체크박스 */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex-shrink-0 mt-0.5">
                            <input 
                                type="checkbox" 
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                            위 내용을 모두 확인하였으며, 회원탈퇴에 동의합니다.
                        </span>
                    </label>
                </div>

                {/* 하단 버튼 */}
                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={!isAgreed}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            isAgreed 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-sm" 
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        탈퇴 신청하기
                    </button>
                </div>
            </div>
        </div>
    );
}