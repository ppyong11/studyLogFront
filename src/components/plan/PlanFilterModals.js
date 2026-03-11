"use client";

import React, { useState, useLayoutEffect } from 'react';
import { X, ArrowDownAZ, ArrowUpZA, CheckCircle, Circle } from 'lucide-react';
import { getTodayString } from '../../utils/dateUtils';
import { Virtuoso } from 'react-virtuoso';
import { showToast } from '../../utils/toastMessage'; // 🔥 1. Toast import 추가
import { calendarStore } from '../../store/calendarStore';

// 필터 모달
export default function PlanFilterModal({ 
    isOpen, 
    onClose, 
    categories,
    filters,
    setFilters,
    resetFilters,
}) {

    // 필터 상태, 조건부 렌더링이라 열 때마다 초기화됨
    const [localStartDate, setLocalStartDate] = useState(getTodayString());
    const [localEndDate, setLocalEndDate] = useState(getTodayString());
    const [localSelectedCats, setLocalSelectedCats] = useState([]);

    // [추가] 상태 필터 (null: 전체, true: 완료, false: 미완료)
    const [localStatus, setLocalStatus] = useState(null);

    // 정렬 방향 상태 (기준은 Date -> Category로 고정)
    const [dateOrder, setDateOrder] = useState('desc'); // 'desc'(최신순) | 'asc'(오래된순)
    const [catOrder, setCatOrder] = useState('asc');    // 'asc'(가나다) | 'desc'(역순)

    // 모달이 열릴 때 초기값 세팅
    useLayoutEffect(() => {
        if (isOpen) {
            setLocalStartDate(filters?.startDate || getTodayString());
            setLocalEndDate(filters?.endDate || getTodayString());
            setLocalSelectedCats(filters?.categories || []);
            setLocalStatus(filters?.status || null);
            
            // ['date,desc', 'category,asc'] 파싱
            const sortList = filters?.sort || ['date,desc', 'category,asc'];
            
            const dateSort = sortList.find(s => s.startsWith('date'));
            const catSort = sortList.find(s => s.startsWith('category'));

            if (dateSort) setDateOrder(dateSort.split(',')[1]);
            else setDateOrder('desc'); // 기본: 내림차순(최신순)

            if (catSort) setCatOrder(catSort.split(',')[1]);
            else setCatOrder('asc'); // 기본: 오름차순(가나다순)
        }
    }, [isOpen, filters, categories]);

    if (!isOpen) return null;

    const handleToggleCat = (catId) => {
        if (localSelectedCats.includes(catId)) { // 해당 id가 이미 선택돼 있으면 삭제 (catId와 다른 것만 남겨라 == 삭제하라)
            setLocalSelectedCats(localSelectedCats.filter(id => id !== catId));
        } else {
            setLocalSelectedCats([...localSelectedCats, catId]); // 선택 안 돼 있으면 배열 뒤에 추가
        }
    };

    const handleApply = () => {
        // 날짜 필수 값 검증 로직
        if (!localStartDate || !localEndDate) { 
            showToast('날짜 범위를 모두 지정해 주세요.', "error"); 
            return; // 리턴해서 onApply 실행 방지
        }

        if (localStartDate > localEndDate) {
            showToast('시작일이 종료일보다 늦을 수 없습니다.', "error"); 
            return;
        }

        // [핵심] 정렬 배열 생성: 항상 1순위 Date, 2순위 Category
        const sortParam = [`date,${dateOrder}`, `category,${catOrder}`];

        setFilters({
            startDate: localStartDate,
            endDate: localEndDate,
            categories: localSelectedCats,
            status: localStatus,
            sort: sortParam
        });
        onClose();
    };

return (
        <div className="fixed inset-0 bg-gray-400/50 z-50 flex items-center justify-center p-4">
            {/* 메인 컨테이너: overflow-hidden을 추가하여 하단바 배경색이 모서리 밖으로 나가지 않게 함 */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* [1. 헤더 영역] - 고정 */}
                <div className="p-5 border-b border-gray-300 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-semibold">필터 및 정렬</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                {/* [2. 중앙 콘텐츠 영역] */}
                <div className="p-5 space-y-6 overflow-y-auto flex-1">
                    {/* 정렬 설정 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">1순위: 날짜 정렬</label>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <button 
                                onClick={() => setDateOrder('desc')}
                                className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border text-xs transition-colors ${dateOrder === 'desc' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <ArrowDownAZ className="w-3 h-3" /> 최신순 (기본)
                            </button>
                            <button 
                                onClick={() => setDateOrder('asc')}
                                className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border text-xs transition-colors ${dateOrder === 'asc' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <ArrowUpZA className="w-3 h-3" /> 과거순
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">2순위: 카테고리 정렬</label>
                            <span className="text-xs text-gray-400">날짜가 같을 때 적용</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCatOrder('asc')}
                                className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border text-xs transition-colors ${catOrder === 'asc' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <ArrowDownAZ className="w-3 h-3" /> 가나다순 (기본)
                            </button>
                            <button 
                                onClick={() => setCatOrder('desc')}
                                className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border text-xs transition-colors ${catOrder === 'desc' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <ArrowUpZA className="w-3 h-3" /> 역순
                            </button>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* 진행 상태 필터 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">진행 상태</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setLocalStatus(null)}
                                className={`flex-1 py-2 rounded-md text-xs border ${localStatus === null ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                전체
                            </button>
                            <button 
                                onClick={() => setLocalStatus(true)}
                                className={`flex-1 py-2 rounded-md text-xs border flex items-center justify-center gap-1 ${localStatus === true ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <CheckCircle className="w-3 h-3" /> 완료
                            </button>
                            <button 
                                onClick={() => setLocalStatus(false)}
                                className={`flex-1 py-2 rounded-md text-xs border flex items-center justify-center gap-1 ${localStatus === false ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Circle className="w-3 h-3" /> 미완료
                            </button>
                        </div>
                    </div>

                    {/* 날짜 범위 필터 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">날짜 범위 <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={localStartDate} 
                                onChange={e => setLocalStartDate(e.target.value)} 
                                className={`w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 ${!localStartDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                            />
                            <span>~</span>
                            <input 
                                type="date" 
                                value={localEndDate} 
                                onChange={e => setLocalEndDate(e.target.value)} 
                                className={`w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 ${!localEndDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                            />
                        </div>
                    </div>

                    {/* 카테고리 선택 필터 */}
                    <div className="space-y-2 max-h-40 overflow-hidden pr-2 border border-gray-300 rounded-md p-2">
                        {categories.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-2">
                                카테고리가 없습니다.
                            </p>
                        )}
                        {categories.length > 0 && (
                            <Virtuoso
                                style={{ height: '160px' }}
                                data={categories}
                                computeItemKey={(index, item) => `${item.id}-${item.bgColor}-${item.bg}`}
                                itemContent={(index, c) => (
                                    <label
                                        key={`${c.id}-${c.bgColor}`}
                                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer select-none"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={localSelectedCats.includes(c.id)}
                                            onChange={() => handleToggleCat(c.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span
                                            className="w-3 h-3 rounded-full border border-black/10 shadow-sm"
                                            style={{ backgroundColor: c.bgColor || c.bg }}
                                        />
                                        <span className="text-sm text-gray-700">
                                            {c.name}
                                        </span>
                                    </label>
                                )}
                            />
                        )}
                    </div>
                </div> {/* <--- 중앙 스크롤 영역 종료 */}

                {/* [3. 하단 버튼 영역] - 고정 (스크롤 영역 밖) */}
                <div className="p-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                    <button 
                        onClick={resetFilters} 
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        초기화
                    </button>
                    <button 
                        onClick={handleApply} 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        적용하기
                    </button>
                </div>
            </div>
        </div>
    );
};