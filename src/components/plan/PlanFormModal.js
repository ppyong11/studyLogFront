"use client";

import { useEffect, useState } from "react";
import CategoryInput from "../common/CategoryInput";
import { getTodayString } from "../../utils/dateUtils";
import { X } from "lucide-react";
import { showToast } from "../../utils/toastMessage";


// 계획 추가/수정 폼 모달
export default function PlanFormModal({ isOpen, isEditMode, onClose, onSave, categories, onAddCategory, onUpdateCategory, onDeleteCategory, initialData = null }) {
    
    // 2. react-window를 동적으로 불러옴 (SSR 끔, 빌드 에러 해결)
    const [name, setName] = useState(initialData?.name || '');
    const [category, setCategory] = useState(initialData?.categoryId || '');
    const [date, setDate] = useState(initialData?.startDate || getTodayString());
    const [endDate, setEndDate] = useState(initialData?.endDate || '');
    const [hours, setHours] = useState(initialData?.minutes ? Math.floor(initialData.minutes / 60) : 0);
    const [minutes, setMinutes] = useState(initialData?.minutes ? initialData.minutes % 60 : 0);
    const [memo, setMemo] = useState(initialData?.memo || '');

        // 카테고리 목록이 뒤늦게 로딩될 경우를 대비해 첫 번째 카테고리로 기본값 보정
    useEffect(() => {
        if (!category && categories.length > 0) {
            setCategory(categories[0].id);
        }
    }, [categories, category]);

    //카테고리 정보(이름, 색상 등)가 외부에서 수정되었을 때 동기화 로직
    useEffect(() => {
        if (category) {
            // 현재 선택된 ID가 categories 목록에 존재하는지 확인
            const target = categories.find(c => c.name ===  category);
            if (target) {
                // 강제로 동일한 ID를 set 하여 select 박스가 새로운 categories 리스트를 바라보게 함
                console.log(target);
                setCategory(target.id);
            }
        }
    }, [categories]);

    // 렌더링 전에 hooks 실행해야 해서 useEffect, useState 후에 넣어야 안전함
    if (!isOpen) return null;

    // page의 update, addPlan 함수에 매개변수를 넘겨주는 게 onSave
    const handleSave = () => {
        if (!name) { showToast('계획명은 필수 입력 값입니다.', "error"); return; }
        if (!category) { showToast('카테고리는 필수 입력 값입니다.', "error"); return; }
        if (!date || !endDate) { showToast('날짜는 필수 입력 값입니다.', "error"); return; }
        
        if (date > endDate) { showToast('시작 날짜가 종료 날짜보다 뒤일 수 없습니다.', "error"); return; }
        
        const totalMinutes = (Number(hours) * 60) + Number(minutes);
        const { id, completed, connectedTimer
            , ...body } = initialData ?? {}; //id, Complete, 타이머 빼고 나머지 필드를 body 객체로 묶음

        if (isEditMode) {
            // 수정 모드면 기본 데이터 기반으로 덮어쓰기
            onSave(id, { ...body, name, categoryId: Number(category), startDate : date, endDate: endDate, minutes: totalMinutes > 0 ? totalMinutes : 0, memo });
        } else {
            onSave({name, categoryId: Number(category), startDate: date, endDate: endDate, minutes: totalMinutes > 0? totalMinutes : 0, memo});
        }
    };

    return (
    <div className="fixed inset-0 bg-gray-400/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-300 flex justify-between items-center">
            <h3 className="text-lg font-semibold">{initialData ? '계획 수정' : '새 계획 추가'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto no-scrollbar">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">계획명</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <CategoryInput 
                    selectedCategory={category} 
                    categories={categories} 
                    onSelect={setCategory} 
                    onAdd={onAddCategory} 
                    onUpdate={onUpdateCategory} 
                    onDelete={onDeleteCategory} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜 범위</label>
                <div className="flex items-center gap-2">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                    <span>~</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">목표 시간</label>
                <div className="flex items-center gap-2">
                    <input type="number" min="0" value={hours} onChange={e => setHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="0" />
                    <span className="text-gray-600">:</span>
                    <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="0" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea value={memo} onChange={e => setMemo(e.target.value)} rows="4" className="w-full p-2 border border-gray-300 rounded-md text-sm"></textarea>
            </div>
        </div>
        <div className="p-5 bg-gray-50 rounded-b-lg flex justify-end gap-3 border-t border-gray-300"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border-gray-300 border rounded-md hover:bg-gray-100">취소</button>
        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">저장하기</button></div>
        </div>
    </div>
    );
};