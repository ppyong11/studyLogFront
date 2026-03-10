'use client';

import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../store/TimerStore';
import { categoryStore } from '../../components/common/CategoryStore';
import TimerItem from '../../components/timer/TimerItem'; 
import { TimerFormModal } from '../../components/timer/TimerModal';
import { authStore } from '../../store/authStore';
import { showToast } from '../../utils/toastMessage';
import { calendarStore } from '../../store/calendarStore';
import { useRouter } from 'next/navigation';
import { Search, Plus, Filter } from 'lucide-react'; 
import PlanDetailModal from '../../components/plan/PlanDetailModal';
import { ActiveFilterChips } from '../../components/common/ActiveFilterChips'; // ✅ 추가됨
import { useCategoryAction } from '../../hooks/useCategoryAction';
import { TimerFilterModal } from '../../components/timer/TimerFilterModal';

export default function TimerPage() {
    const router = useRouter();
    const { user, isChecking, hasChecked } = authStore();
    
    const { handleAddCategory, handleUpdateCategory, handleDeleteCategory } = useCategoryAction();

    const { resetFilters } = useTimerStore();
    // 타이머 페이지 전용 기본 필터값 세팅
    const timerDefaultFilters = {
        page: 1,
        startDate: null,
        endDate: null,
        status: '',
        keyword: "",
        categories: [],
        sort: 'date,desc'
    };

    // zustand store 사용
    const { 
        timers, filters, setFilters, fetchTimers, 
        isLoading, totalPages, page, updateTimer, addTimer, updatePlanNameInTimers,
        deleteTimer, resetTimer, controlTimer
    } = useTimerStore();

    const { categories, fetchCategories } = categoryStore();
    const { getPlan, updatePlan, updateStatusPlan, deletePlan } = calendarStore();

    // 상태 관리
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTimer, setEditingTimer] = useState(null);

    const viewType = 'grid';

    // 초기 데이터 로드 및 로그인 체크
    useEffect(() => {
        if (!hasChecked || isChecking || !user) return;
        try {
            fetchCategories();
            fetchTimers();
        } catch (error) {
            showToast(error.response?.data?.message || "서버 연결 실패", "error");
        }
    }, [hasChecked, isChecking, user, filters]);

    useEffect(() => {
        if (!hasChecked || isChecking) return;
        if (!user) {
            showToast("로그인 후 이용해 주세요", "error");
            router.replace('/login');
        }
    }, [hasChecked, isChecking, user, router]);

    useEffect(() => {
        // 컴포넌트가 화면에서 사라질 때(다른 페이지로 나갈 때) 무조건 1페이지로 리셋
        return () => {
            setFilters({ page: 1 });
        };
    }, [setFilters]);

    if (!hasChecked || isChecking) return <div className="flex justify-center p-10">로딩 중...</div>;
    if (!user) return null;

    // --- 핸들러 함수들 ---

    const handleFilterChange = (key, value) => setFilters({ [key]: value });

    // 필터 삭제 핸들러 (X 버튼 클릭 시)
    const handleRemoveFilter = (key) => {
        if (key === 'status') {
            setFilters({ status: '' }); 
        } else if (key === 'date') {
            setFilters({ startDate: null, endDate: null }); 
        } else if (key === 'sort_date') {
            setFilters({ sort: ['date,desc'] }); // 기본값(최신순)으로 복구
        } else if (key === 'categories') {
            setFilters({ categories: [] });
        }
    };

    const handleOpenPlanDetail = async (planId) => {
        if (!planId) return;
        try {
            const planData = await getPlan(planId); 
            setSelectedPlan(planData);
            setIsDetailOpen(true);
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleAddClick = () => {
        setEditingTimer(null);
        setIsFormModalOpen(true);
    };

    const handleEditTimer = (timer) => {
        setEditingTimer(timer);
        setIsFormModalOpen(true);
    };

    const handleControlTimer = async (id, action) => {
        await controlTimer(id, action);
    }

    const handleSaveTimer = async (idOrData, editData) => {
        try {
            if (editingTimer) {
                await updateTimer(idOrData, editData);
                showToast("타이머가 수정되었습니다.");
            } else {
                await addTimer(idOrData);
                showToast("타이머가 추가되었습니다.");
            }
            setIsFormModalOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleDeleteTimer = async (id, currentPage) => {
        try {
            await deleteTimer(id);

            // 삭제 후, 현재 화면(현재 페이지)에 타이머가 딱 1개(방금 지운 것)만 남아있었다면?
            if (timers.length === 1) {
                if (currentPage > 1) {
                    handleFilterChange('page', currentPage - 1);
                } else {
                    // 1페이지의 마지막 항목을 지웠다면, 그냥 1페이지를 다시 호출해서 빈 배열을 받아옴
                    await fetchTimers(); 
                }
            } else {
                // 여러 개 중 하나를 지운 거라면, 현재 페이지만 다시 새로고침
                await fetchTimers();
            }

            showToast("타이머가 삭제되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleResetTimer = async (id) => {
        try {
            await resetTimer(id);
            showToast("타이머가 초기화되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleUpdatePlan = async (id, updatedData) => {
        try {
            const response = await updatePlan(id, updatedData, viewType);
            updatePlanNameInTimers(id, updatedData.name, updatedData.categoryId);
            setSelectedPlan(response);
            setIsEditMode(false);
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleDeletePlan = async (id) => {
        try {
            await deletePlan(id);
            setIsDetailOpen(false);
            showToast("계획이 삭제되었습니다.");
        } catch(error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleToggleComplete = async (id, currentStatus) => {
        try {
            const response = await updateStatusPlan(id, currentStatus, viewType);
            setSelectedPlan(response);
        } catch(error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* 1. 상단 컨트롤 패널 */}
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-300">
                <div className="relative w-full md:w-auto md:flex-1">
                    <input 
                        type="text"
                        placeholder="타이머 검색..."
                        value={filters.keyword || ''} 
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        title="필터"
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={handleAddClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>타이머 추가</span>
                    </button>
                </div>
                
            </div>
            {/* 적용된 필터 칩 (Plan 페이지와 동일) */}
            <div className="mt-1">
                <ActiveFilterChips 
                    filters={filters} 
                    categories={categories} 
                    onRemoveFilter={handleRemoveFilter} 
                    onResetAll={resetFilters}              // 🔥 타이머 스토어의 리셋 함수
                    defaultFilters={timerDefaultFilters}   // 🔥 타이머 기본 규칙
                />
            </div>
            
            {/* 3. 메인 뷰 컨텐츠 (리스트 영역) */}
            <div className="flex-1 px-5 pt-4 pb-10 overflow-auto">
                <div className="flex flex-col gap-3">
                    {isLoading && timers.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 font-medium">데이터를 가져오고 있어요...</div>
                    ) : timers.length > 0 ? (
                        timers.map((timer) => (
                            <TimerItem 
                                key={timer.id} 
                                timer={timer} 
                                onPlanClick={handleOpenPlanDetail}
                                onEdit={handleEditTimer}
                                onDelete={handleDeleteTimer}
                                onReset={handleResetTimer}
                                onControl={handleControlTimer}
                                page={page}
                            />
                        ))
                    ) : (
                        <div className="py-20 text-center text-gray-400 font-medium">검색 결과가 없어요 🥲</div>
                    )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="mt-10 flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handleFilterChange('page', pageNum)}
                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                        page === pageNum 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'bg-white border text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* 모달 영역 */}
            <TimerFilterModal 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)}
                categories={categories}
            />

            {isDetailOpen && selectedPlan && (
                <PlanDetailModal 
                    isOpen={isDetailOpen} 
                    onClose={() => { setIsDetailOpen(false); setIsEditMode(false); }} 
                    plan={selectedPlan} 
                    isEditMode={isEditMode} 
                    setEditMode={setIsEditMode}
                    onUpdate={handleUpdatePlan} 
                    onDelete={handleDeletePlan}
                    onToggleComplete={() => handleToggleComplete(selectedPlan.id, selectedPlan.completed)} 
                    categories={categories}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                />
            )}

            <TimerFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                initialData={editingTimer}
                onSave={handleSaveTimer}
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
            />
        </div>
    );
}