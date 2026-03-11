"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react'; 
import { showToast } from '../../utils/toastMessage';
import api from '../../utils/api/axios';


// 비밀번호 변경 모달
export default function PasswordChangeModal({ isOpen, onClose }) {
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