"use client";

import { X, Calendar as CalendarIcon, List, Clock, AlignLeft } from 'lucide-react';
import { formatGoalTime } from '../../utils/dateUtils';
import CategoryBadge from '../common/CategoryBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useState } from 'react';
import PlanFormModal from './PlanFormModal';

// 계획 상세 모달
export default function PlanDetailModal({ isOpen, onClose, plan, isEditMode, setEditMode, onUpdate, onDelete, onToggleComplete, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) {
    if (!isOpen || !plan) 
        return null;
    if (isEditMode) 
        return <PlanFormModal isOpen={true} isEditMode={isEditMode} onClose={() => setEditMode(false)} onSave={onUpdate} categories={categories} onAddCategory={onAddCategory} onUpdateCategory={onUpdateCategory} onDeleteCategory={onDeleteCategory} initialData={plan} />;
    const dateStr = plan.endDate ? `${plan.startDate} ~ ${plan.endDate}` : plan.startDate;

    const [showDeletePopup, setShowDeletePopup] = useState(false);

    const handleDeleteClick = () => {
        setShowDeletePopup(true);
    };

    // 삭제 팝업에서 확인 누르면 삭제
    const handleDeleteConfirm = () => {
        // page에 삭제 요청
        onDelete(plan.id);
        // 팝업 닫기
        setShowDeletePopup(false);
    };

    return (
    <div className="fixed inset-0 bg-gray-400/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        <div className="p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <div className="flex justify-between items-start mb-6 pr-8"><h2 className="text-2xl font-bold text-gray-900 leading-tight">{plan.name}</h2></div>
            <div className="space-y-5">
            <div className="flex items-start gap-3"><CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" /><div><p className="text-sm font-medium text-gray-500">날짜</p><p className="text-gray-800 font-medium mt-0.5">{dateStr}</p></div></div>
            <div className="flex items-start gap-3"><List className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-gray-500">카테고리</p>
                    <CategoryBadge categoryId={plan.categoryId} className="mt-1" />
                </div>
            </div>
            <div className="flex items-start gap-3"><Clock className="h-5 w-5 text-gray-400 mt-0.5" /><div><p className="text-sm font-medium text-gray-500">목표 시간</p><p className="text-gray-800 mt-0.5">{formatGoalTime(plan.minutes)}</p></div></div>
            <div className="flex items-start gap-3"><AlignLeft className="h-5 w-5 text-gray-400 mt-0.5" /><div className="w-full"><p className="text-sm font-medium text-gray-500 mb-1">메모</p><div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto custom-scrollbar"><p className="text-gray-700 text-sm whitespace-pre-wrap">{plan.memo || ""}</p></div></div></div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-300 mt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={plan.completed} onChange={onToggleComplete} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /><span className="text-sm font-medium text-gray-700">완료</span></label>
                <div className="ml-auto flex gap-2">
                    <button onClick={handleDeleteClick} className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">삭제</button>
                    <button onClick={() => setEditMode(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">수정</button>
                </div>
                    {showDeletePopup && (
                        <ConfirmModal
                            title="계획 삭제"
                            message="해당 계획을 삭제하시겠습니까? 타이머에 설정된 계획일 경우 타이머도 함께 삭제됩니다."
                            onConfirm={handleDeleteConfirm} // page의 삭제 함수를 confirm에 넘김
                            onCancel={() => setShowDeletePopup(false)}
                        />
                        
                    )}
            </div>
            </div>
        </div>
        </div>
    </div>
    );
};