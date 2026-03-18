'use client';

import { useLayoutEffect, useState } from 'react';
import { ArrowDownAZ, ArrowUpZA, X } from 'lucide-react';
import { useTimerStore } from '../../store/TimerStore';
import { Virtuoso } from 'react-virtuoso';

export const TimerFilterModal = ({ isOpen, onClose, categories }) => {
    // 스토어에서 상태와 액션 가져오기
    const { filters, setFilters } = useTimerStore();

    // 로컬 상태
    const [localStartDate, setLocalStartDate] = useState('');
    const [localEndDate, setLocalEndDate] = useState('');
    const [localStatus, setLocalStatus] = useState('');
    const [dateOrder, setDateOrder] = useState('desc'); // 무조건 최신순(desc)이 기본
    const [localSelectedCats, setLocalSelectedCats] = useState([]);
    
    // 모달이 열릴 때 스토어 값으로 초기화
    useLayoutEffect(() => {
        if (isOpen) {
            setLocalStartDate(filters?.startDate || '');
            setLocalEndDate(filters?.endDate || '');
            setLocalStatus(filters?.status || '');
            setLocalSelectedCats(filters?.categories || []);
            
            // sort 배열에서 방향 추출 (예: 'date,desc')
            const sortStr = filters?.sort?.[0] || 'date,desc'; 
            setDateOrder(sortStr.split(',')[1] || 'desc');
        }
    }, [isOpen, filters]);

    if (!isOpen) return null;

    const handleApply = async () => {
        // 날짜 유효성 검사 로직 추가
        // 한쪽만 입력된 경우 차단
        if ((localStartDate && !localEndDate) || (!localStartDate && localEndDate)) {
            showToast('시작일과 종료일을 모두 지정하거나, 모두 비워주세요.', "error");
            return; // onApply 실행 중단
        }

        // 시작일이 종료일보다 늦은 경우 차단
        if (localStartDate && localEndDate && localStartDate > localEndDate) {
            showToast('시작일이 종료일보다 늦을 수 없습니다.', "error");
            return;
        }

        const sortParam = [`date,${dateOrder}`];

        setFilters({
            ...filters, // keyword 등 기존 상태 유지
            startDate: localStartDate,
            endDate: localEndDate,
            status: localStatus,
            categories: localSelectedCats,
            sort: sortParam
        });
        onClose();
    };

    const handleReset = () => {
        setLocalStartDate('');
        setLocalEndDate('');
        setLocalStatus('');
        setDateOrder('desc'); // 초기화 시 무조건 최신순
        setLocalSelectedCats([]);
    };

    const handleToggleCat = (catId) => {
        if (localSelectedCats.includes(catId)) { // 해당 id가 이미 선택돼 있으면 삭제 (catId와 다른 것만 남겨라 == 삭제하라)
            setLocalSelectedCats(localSelectedCats.filter(id => id !== catId));
        } else {
            setLocalSelectedCats([...localSelectedCats, catId]); // 선택 안 돼 있으면 배열 뒤에 추가
        }
    };

    // 상태 옵션 배열
    const statuses = [
        { value: '', label: '전체' },
        { value: 'READY', label: 'READY' },
        { value: 'RUNNING', label: 'RUNNING' },
        { value: 'PAUSED', label: 'PAUSED' },
        { value: 'ENDED', label: 'ENDED' }
    ];

    return (
        <div className="fixed inset-0 bg-gray-400/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* 헤더 */}
                <div className="p-5 border-b border-gray-300 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-semibold">타이머 필터 및 정렬</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                {/* 중앙 콘텐츠 */}
                <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* 정렬 설정 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">날짜 정렬</label>
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
                    </div>

                    <hr className="border-gray-100" />

                    {/* 진행 상태 필터 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">타이머 상태</label>
                        <div className="flex flex-wrap gap-2">
                            {statuses.map((s) => (
                                <button 
                                    key={s.label}
                                    onClick={() => setLocalStatus(s.value)}
                                    className={`flex-1 min-w-[30%] py-2 rounded-md text-xs border font-medium transition-colors ${
                                        localStatus === s.value 
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* 날짜 범위 필터 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">조회 기간</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={localStartDate} 
                                onChange={e => setLocalStartDate(e.target.value)} 
                                className={`w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 ${!localStartDate && localEndDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} 
                            />
                            <span className="text-gray-400">~</span>
                            <input 
                                type="date" 
                                value={localEndDate} 
                                onChange={e => setLocalEndDate(e.target.value)} 
                                className={`w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 ${localStartDate && !localEndDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} 
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
                </div> 

                {/* 하단 버튼 */}
                <div className="p-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                    <button 
                        onClick={handleReset} 
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