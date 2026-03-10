import React from 'react';
import { X } from 'lucide-react';
import { showToast } from "../../utils/toastMessage";

export const ActiveFilterChips = ({ 
    filters, 
    categories, 
    onRemoveFilter,
    onResetAll,        // 🔥 스토어 직접 참조 제거 (부모가 함수 전달)
    defaultFilters     // 🔥 도메인(Plan/Timer)마다 다른 기본값을 부모가 전달
}) => {
    const chips = [];

    // 1. 상태 필터 (플랜은 true/false, 타이머는 'RUNNING' 등 문자열)
    if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
        let statusLabel = filters.status;
        if (filters.status === true) statusLabel = '완료됨';
        if (filters.status === false) statusLabel = '미완료';
        
        chips.push({ 
            key: 'status', 
            label: `상태: ${statusLabel}`,
            disabled: filters.status === defaultFilters.status 
        });
    }

    // 2. 날짜 필터
    const isDefaultDate = filters.startDate === defaultFilters.startDate && filters.endDate === defaultFilters.endDate;
    if (filters.startDate && filters.endDate) {
        chips.push({ 
            key: 'date', 
            label: `${filters.startDate} ~ ${filters.endDate}`,
            disabled: isDefaultDate
        });
    }
    
    // 3. 카테고리 필터
    if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(catId => {
            const cat = categories.find(c => c.id === catId);
            if (cat) {
                chips.push({ key: 'categories', val: cat.id, label: cat.name, disabled: false });
            }
        });
    }

    const rawSort = filters.sort || [];
    const sortList = Array.isArray(rawSort) ? rawSort : [rawSort];
    
    // 기본 필터도 동일하게 처리
    const rawDefaultSort = defaultFilters.sort || [];
    const defaultSortList = Array.isArray(rawDefaultSort) ? rawDefaultSort : [rawDefaultSort];

    // 4-1. 날짜 정렬
    const dateSort = sortList.find(s => s.startsWith('date'));
    if (dateSort) {
        const isDateAsc = dateSort.includes('asc');
        const defaultDateSort = defaultSortList.find(s => s.startsWith('date')) || 'date,desc';
        const isDefaultDateSort = dateSort === defaultDateSort; 
        
        chips.push({ 
            key: 'sort_date', 
            label: `정렬: ${isDateAsc ? '과거순' : '최신순'}`,
            disabled: isDefaultDateSort
        });
    }

    // 4-2. 카테고리 정렬 (플랜에만 존재, 타이머는 무시됨)
    const catSort = sortList.find(s => s.startsWith('category'));
    if (catSort) {
        const isCatDesc = catSort.includes('desc');
        const defaultCatSort = defaultFilters.sort?.find(s => s.startsWith('category')) || 'category,asc';
        const isDefaultCatSort = catSort === defaultCatSort;
        
        chips.push({ 
            key: 'sort_category', 
            label: `분류: ${isCatDesc ? '역순' : '가나다순'}`,
            disabled: isDefaultCatSort
        });
    }

    if (chips.length === 0) return null;

    const normalize = (val) => (val === null || val === undefined) ? '' : val;

    // 현재 필터가 기본값과 100% 동일한지 체크 (초기화 버튼 표시 여부)
    const isAllDefault = 
        normalize(filters.startDate) === normalize(defaultFilters.startDate) &&
        normalize(filters.endDate) === normalize(defaultFilters.endDate) &&
        normalize(filters.status) === normalize(defaultFilters.status) &&
        normalize(filters.keyword) === normalize(defaultFilters.keyword) &&
        (filters.categories || []).length === (defaultFilters.categories || []).length &&
        // sort 비교 시 위에서 정규화한 배열(sortList, defaultSortList)끼리 비교
        JSON.stringify(sortList) === JSON.stringify(defaultSortList);
        
    return (
        <div className="px-5 py-2 flex flex-wrap gap-2 items-center bg-white border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 mr-1">적용된 필터:</span>
            {chips.map((chip, idx) => (
                <span 
                    key={`${chip.key}-${idx}`} 
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${chip.disabled
                            ? 'bg-gray-200 text-gray-800 border-gray-300 cursor-not-allowed opacity-60'
                            : 'text-blue-600 hover:bg-blue-200 bg-blue-50 text-blue-700 border-blue-100'}
                        `}
                >
                    {chip.label}
                    <button 
                        disabled={chip.disabled}
                        onClick={!chip.disabled ? () => onRemoveFilter(chip.key, chip.val) : undefined}
                        className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors
                            ${chip.disabled ? '' : 'text-blue-600'}`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            
            {/* 전체 초기화 버튼 */}
            {!isAllDefault && onResetAll && (
                <button 
                    onClick={() => {
                        onResetAll();
                        showToast("검색 조건이 초기화되었습니다.");
                    }}
                    className="text-xs text-gray-400 underline hover:text-gray-600 ml-auto"
                >
                    필터 초기화
                </button>
            )}
        </div>
    );
};