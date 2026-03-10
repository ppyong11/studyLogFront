'use client';

import React, { useState, useEffect  } from 'react';
import { X, Search, CalendarDays, Link2Off, ChevronDown, ChevronUp, Clock, AlertCircle, PlusCircle, Loader2,
    ArrowDownWideNarrow, ArrowUpNarrowWide, 
    } from 'lucide-react';
import { showToast } from '../../utils/toastMessage';
import CategoryInput from '../common/CategoryInput';
import { formatPeriod, getDDay, getTodayString } from '../../utils/dateUtils';
import api from "../../utils/api/axios";

import CategoryBadge from '../common/CategoryBadge';
import { ConfirmModal } from '../common/ConfirmModal';

// 시간 포맷 유틸 (분 -> 시간 분)
const formatMinutesToTime = (totalMinutes) => {
    if (!totalMinutes) return "0분";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
};

// 수정, 삭제 폼
export const TimerFormModal = ({ 
    isOpen, onClose, onSave, initialData = null, initialDataPlan = null,
    categories, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
    console.log("타이머 폼: ", initialDataPlan);
    // ... (기본 상태들 동일) ...
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [planId, setPlanId] = useState(null);
    const [planName, setPlanName] = useState('');
    const [planEndDate, setPlanEndDate] = useState('');
    // 계획 마감일 저장
    const [selectedPlanEndDate, setSelectedPlanEndDate] = useState(null);

    const [isPlanSelectorOpen, setIsPlanSelectorOpen] = useState(false); 
    const [targetStartDate, setTargetStartDate] = useState(getTodayString());      
    const [targetEndDate, setTargetEndDate] = useState(getTodayString());
    const [searchKeyword, setSearchKeyword] = useState(''); 
    const [isLoading, setIsLoading] = useState(true);

    // ✅ 2. 정렬 상태 분리 (독립적 관리)
    // 1순위: 날짜 (기본 내림차순 - 최신순)
    const [dateOrder, setDateOrder] = useState('desc'); 
    // 2순위: 카테고리 (기본 오름차순 - 가나다순)
    const [categoryOrder, setCategoryOrder] = useState('asc');

    const [plans, setPlans] = useState([]);                    
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const isEditMode = !!initialData;

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: null, onCancel: null 
    });

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setCategory(initialDataPlan?.categoryId || initialData?.categoryId || '');
            setPlanId(initialData?.connectedPlan?.id || initialDataPlan?.id || null);
            setPlanName(initialData?.connectedPlan?.name || initialDataPlan?.name || '');
            setPlanEndDate(initialData?.connectedPlan?.endDate || initialDataPlan?.endDate || '');
            
            // 초기화
            setIsPlanSelectorOpen(false);
            setSearchKeyword('');
            // 정렬 초기화
            setDateOrder('desc');
            setCategoryOrder('asc');
            
            const today = getTodayString();
            setTargetStartDate(today);
            setTargetEndDate(today);
            setPlans([]);
            setPage(1);
            setHasMore(false);

            // 세팅 끝나면 로딩 해제
            setIsLoading(false);
        } else {
            // 모달 닫힐 때 다시 로딩 상태로 돌려놓음
            setIsLoading(true);
        }
    }, [isOpen, initialData, initialDataPlan]);

    useEffect(() => {
        if (category && categories) {
            const target = categories.find(c => c.name === category);
            if (target) setCategory(target.id);
        }
    }, [categories, category]);

    // 날짜 변경 시 재검색
    useEffect(() => {
        if (isPlanSelectorOpen && targetStartDate && targetEndDate) {
            if (targetStartDate > targetEndDate) {
                setTargetEndDate(targetStartDate);
            } else {
                fetchPlans(1);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlanSelectorOpen, targetStartDate, targetEndDate]);

    // ✅ 3. 정렬 상태 변경 시 재검색 (dateOrder, categoryOrder 감지)
    useEffect(() => {
        if (isPlanSelectorOpen) {
            fetchPlans(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateOrder, categoryOrder]); 

    // ✅ [API 호출] 계획 목록 조회
    const fetchPlans = async (pageNum) => {
        if (pageNum === page && isLoadingPlans && pageNum !== 1) return; 
        
        setIsLoadingPlans(true);
        try {
            const sortParams = [
                `date,${dateOrder}`,       // 1순위: 날짜
                `category,${categoryOrder}`
            ];

            const res = await api.get(`/plans/search`, {
                params: {
                    startDate: targetStartDate,
                    endDate: targetEndDate,
                    keyword: searchKeyword || null,
                    status: false, 
                    page: pageNum,
                    sort: sortParams
                }
            });
            
            const newPlans = res.data.plans || []; 
            const hasNext = res.data.hasNext;
            
            if (pageNum === 1) {
                setPlans(newPlans);
            } else {
                setPlans(prev => [...prev, ...newPlans]);
            }

            setPage(pageNum);
            setHasMore(hasNext);

        } catch (error) {
            console.error("계획 조회 실패", error);
            if (pageNum === 1) setPlans([]);
        } finally {
            setIsLoadingPlans(false);
        }
    };

    const handleLoadMore = () => {
        if (hasMore && !isLoadingPlans) {
            fetchPlans(page + 1);
        }
    };

    const handleKeywordSearch = () => {
        fetchPlans(1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleKeywordSearch();
        }
    };

    const applyPlanSelection = (plan) => {
        setPlanId(plan.id);
        setPlanName(plan.name);
        setSelectedPlanEndDate(plan.endDate); // 마감일 기록
        if (!name) setName(plan.name); 
        setCategory(plan.categoryId);  
        setIsPlanSelectorOpen(false); 
    };

    // 2. handleSelectPlan 수정: startDate ~ endDate 모두 검사 및 하루 안 보기 적용
    const handleSelectPlan = (plan) => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const start = new Date(plan.startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(plan.endDate);
        end.setHours(0, 0, 0, 0);

        // 오늘 날짜가 계획 기간(시작일 ~ 종료일) 밖인지 확인
        const isOutOfRange = today < start || today > end;

        if (isOutOfRange) {
            setConfirmModal({
                isOpen: true,
                title: "계획 기간 불일치",
                message: (
                    <div className="flex flex-col gap-2 text-left">
                        <p className="text-gray-800">오늘 날짜가 계획의 진행 기간에 포함되지 않습니다.</p>
                        <p className="text-sm text-gray-500 font-mono bg-gray-50 p-1.5 rounded w-max">
                            기간: {plan.startDate} ~ {plan.endDate}
                        </p>
                        <p className="text-sm font-bold text-red-500 mt-1">
                            이대로 연결하면 목표 시간을 달성해도 자동 완료 처리가 되지 않을 수 있습니다.<br/>그래도 연결하시겠습니까?
                        </p>
                    </div>
                ),
                onConfirm: () => {
                    applyPlanSelection(plan);
                }
            });
            return; 
        }

        // 기간 안이거나, 오늘 하루 안 보기 상태면 바로 적용
        applyPlanSelection(plan);
    };

    const handleRemovePlan = () => {
        setPlanId(null);
        setPlanName('');
    };
            
    const restoreOriginalPlan = () => {
        console.log(initialData);
        setPlanId(initialData?.connectedPlan?.id || null);
        setPlanName(initialData?.connectedPlan?.name || '');
        setPlanEndDate(initialData?.connectedPlan?.endDate || '');
        setCategory(initialData?.categoryId || ''); 
        setSelectedPlanEndDate(null);
        showToast("기존 계획 상태로 복구되었습니다.", "info");
    };

    // 3. 더 스마트해진 handleSave
    const handleSave = () => {
        if (!name.trim()) { showToast('타이머 이름은 필수입니다.', 'error'); return; }
        if (!category) { showToast('카테고리는 필수입니다.', 'error'); return; }

        const payload = { 
            name, 
            categoryId: Number(category), 
            planId: planId 
        };

        // ✅ executeSave를 비동기(async)로 만들고 try-catch 적용
        const executeSave = async () => {
            try {
                if (isEditMode) {
                    await onSave(initialData.id, payload);
                } else {
                    await onSave(payload);
                }
            } catch (error) {
                console.error("저장 중 에러 발생:", error);
                // 🚨 에러가 발생하면 원래 계획 상태로 되돌림!
                restoreOriginalPlan();
            }
        };

        if (isEditMode) {
            const originalPlanId = initialData?.connectedPlan?.id || null; // ✅ 기존 planId 추출 방식도 수정
            const currentPlanId = planId;
            const isPlanChanged = originalPlanId !== currentPlanId;
            
            // ... 이하 조건문 로직 (기존과 동일)
            if (isPlanChanged) {
                // 1) 계획을 아예 삭제(연결 해제) 해버린 경우
                if (!currentPlanId) {
                    setConfirmModal({
                        isOpen: true,
                        title: "계획 연결 해제",
                        message: "기존에 연결된 계획을 해제하고 저장하시겠습니까?",
                        onConfirm: executeSave,
                        onCancel: restoreOriginalPlan
                    });
                    return;
                }

                // 2) 새로운 계획을 추가하거나, 다른 계획으로 변경하는 경우
                if (currentPlanId) {
                    const isExecuted = initialData?.status && initialData.status !== 'READY';
                    
                    let isPlanAfterTimerCreate = false;
                    if (initialData?.createAt && selectedPlanEndDate) {
                        const createDate = new Date(initialData.createAt.split(' ')[0]);
                        const endDate = new Date(selectedPlanEndDate);
                        
                        createDate.setHours(0, 0, 0, 0);
                        endDate.setHours(0, 0, 0, 0);
                        
                        isPlanAfterTimerCreate = endDate >= createDate;
                    }

                    if (isExecuted && isPlanAfterTimerCreate) {
                        setConfirmModal({
                            isOpen: true,
                            title: "타이머 누적 시간 충돌",
                            message: "이미 실행된 이력이 있는 타이머에 새로운 계획을 연결하면 자동 완료 처리가 정확하지 않을 수 있습니다.\n그래도 연결하시겠습니까?",
                            onConfirm: executeSave,
                            onCancel: restoreOriginalPlan
                        });
                        return;
                    }

                    if (originalPlanId) {
                        setConfirmModal({
                            isOpen: true,
                            title: "계획 변경",
                            message: "연결된 계획이 변경되었습니다. 저장하시겠습니까?",
                            onConfirm: executeSave,
                            onCancel: restoreOriginalPlan
                        });
                        return;
                    }
                }
            }
        }
        
        // 아무것도 변경하지 않았거나, 위 조건들을 다 통과하면 바로 저장!
        executeSave();
    };

    // 타이머 종료 상태
    const isEnded = initialData?.status === 'ENDED';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-400/50 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] z-10">
                
                {/* 헤더 */}
                <div className="p-5 border-b border-gray-300 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-semibold">{isEditMode ? '타이머 수정' : '새 타이머 추가'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>

                {/* 🌟 핵심: isLoading이 true일 때 보여줄 로딩 화면 🌟 */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                        <p className="text-sm font-medium text-gray-500">데이터를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    /* 🌟 isLoading이 false일 때 보여줄 원래 폼 화면 🌟 */
                    <>
                        {/* 바디 */}
                        <div className="p-2 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {isEnded &&
                                <div className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 p-2 rounded-md">
                                    <AlertCircle size={14} />
                                    <span>종료된 타이머는 계획을 변경하거나 추가할 수 없습니다.</span>
                                </div>    
                            }
                            
                            {/* 계획 연결 섹션 */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div 
                                    onClick={() => {
                                        if (!isEnded) setIsPlanSelectorOpen(!isPlanSelectorOpen);
                                    }}
                                    className={`p-3.5 flex justify-between items-center cursor-pointer transition-colors ${planId ? 'bg-blue-50/80' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-center gap-1">
                                        <CalendarDays size={18} className={planId ? "text-blue-600" : "text-gray-500"} />
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold flex gap-1 ${planId ? "text-blue-700" : "text-gray-600"}`}>
                                                {planId ? (
                                                    <>
                                                        {planName}
                                                        <span className="px-1 py-0.5 text-[10px] font-bold text-rose-500 bg-rose-50 rounded border border-rose-100 whitespace-nowrap">
                                                            {getDDay(planEndDate)}
                                                        </span>
                                                    </>
                                                    ) : (
                                                    <>
                                                        계획 불러오기
                                                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-gray-100 rounded border border-gray-200 whitespace-nowrap">
                                                            선택
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    {isPlanSelectorOpen ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                                </div>

                                {/* 리스트 영역 */}
                                {isPlanSelectorOpen && (
                                    <div className="p-4 bg-white border-t border-gray-100 animate-in slide-in-from-top-2">
                                        
                                        {/* 필터 및 정렬 영역 */}
                                        <div className="mb-4 space-y-3">
                                            {/* 키워드 검색 */}
                                            <div className="relative flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={searchKeyword}
                                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        placeholder="계획 이름 검색..."
                                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                                                    />
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                </div>
                                                <button 
                                                    onClick={handleKeywordSearch}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    검색
                                                </button>
                                            </div>

                                            {/* 날짜 검색 */}
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs font-bold text-gray-500 ml-1">기간 조회</span>
                                                <div className="flex items-center gap-2">
                                                    <input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} className="flex-1 p-1.5 border border-gray-300 rounded text-xs outline-none focus:border-blue-500 font-medium" />
                                                    <span className="text-gray-400 text-xs">~</span>
                                                    <input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} min={targetStartDate} className="flex-1 p-1.5 border border-gray-300 rounded text-xs outline-none focus:border-blue-500 font-medium" />
                                                </div>
                                            </div>
                                            
                                            {/* 5. 정렬 버튼 영역 (독립적 토글) */}
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 p-2 rounded-md">
                                                    <AlertCircle size={14} />
                                                    <span>미완료 계획만 표시</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    {/* 날짜 정렬 토글 */}
                                                    <button 
                                                        onClick={() => setDateOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border text-gray-500 border-gray-200 hover:bg-gray-50`}
                                                    >
                                                        날짜
                                                        {dateOrder === 'asc' 
                                                            ? <ArrowUpNarrowWide size={14} /> 
                                                            : <ArrowDownWideNarrow size={14} /> 
                                                        }
                                                    </button>

                                                    {/* 카테고리 정렬 토글 */}
                                                    <button 
                                                        onClick={() => setCategoryOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white text-gray-500 border-gray-200 hover:bg-gray-50`}
                                                    >
                                                        카테고리
                                                        {categoryOrder === 'asc' 
                                                            ? <ArrowUpNarrowWide size={14} /> 
                                                            : <ArrowDownWideNarrow size={14} /> 
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 계획 리스트 */}
                                        <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2">
                                            {plans.length === 0 && !isLoadingPlans ? (
                                                <div className="py-8 text-center flex flex-col items-center gap-2 text-gray-400">
                                                    <Search size={24} className="opacity-20" />
                                                    <p className="text-xs">검색 결과가 없습니다.</p>
                                                </div>
                                            ) : (
                                                plans.map(plan => (
                                                    <div 
                                                        key={plan.id}
                                                        onClick={() => handleSelectPlan(plan)}
                                                        className={`p-3 rounded-lg border cursor-pointer flex flex-col gap-2 hover:bg-gray-50 transition-all ${
                                                            planId === plan.id 
                                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                                            : 'border-gray-100 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <CategoryBadge categoryId={plan.categoryId} />
                                                                <span className="text-sm font-bold text-gray-800 truncate">{plan.name}</span>
                                                            </div>
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-500 bg-rose-50 rounded border border-rose-100 whitespace-nowrap">
                                                                {getDDay(plan.endDate)}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3 text-[11px] text-gray-400 ml-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <CalendarDays size={11} />
                                                                <span>{formatPeriod(plan.startDate, plan.endDate)}</span>
                                                            </div>
                                                            <div className="w-[1px] h-2 bg-gray-200"></div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={11} />
                                                                <span>목표 {formatMinutesToTime(plan.minutes)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}

                                            {isLoadingPlans && <div className="py-2 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-400" /></div>}
                                            {!isLoadingPlans && hasMore && <button onClick={handleLoadMore} className="w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1 transition-colors"><PlusCircle size={14} /> 더 보기</button>}
                                        </div>
                                    </div>
                                )}
                                
                                {/* 연결 해제 버튼 */}
                                {planId && !isPlanSelectorOpen && (
                                    <div className="border-t border-blue-100 bg-blue-50/30 p-2 flex justify-end">
                                        <button onClick={handleRemovePlan} className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"><Link2Off size={12} /> 연결 해제</button>
                                    </div>
                                )}
                            </div>

                            {/* 기존 입력 필드들 유지 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">타이머 이름</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="할 일을 입력하세요" className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                <CategoryInput selectedCategory={category} categories={categories} onSelect={setCategory} onAdd={onAddCategory} onUpdate={onUpdateCategory} onDelete={onDeleteCategory} />
                            </div>
                        </div>

                        {/* 푸터 */}
                        <div className="p-5 bg-gray-50 rounded-b-lg flex justify-end gap-3 border-t border-gray-300 shrink-0">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border-gray-300 border rounded-md hover:bg-gray-100 transition-colors">취소</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors shadow-sm">{isEditMode ? '수정 완료' : '추가하기'}</button>
                        </div>
                    </>
                )}
            </div>
            
            {/* 범용 컨펌 모달 */}
            {confirmModal.isOpen && (
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={() => {
                        if (confirmModal.onConfirm) confirmModal.onConfirm();
                        setConfirmModal({ ...confirmModal, isOpen: false, onCancel: null });
                    }}
                    onCancel={() => {
                        if (confirmModal.onCancel) confirmModal.onCancel();
                        setConfirmModal({ ...confirmModal, isOpen: false, onCancel: null });
                    }}
                />
            )}
        </div>
    );
};