"use client";

import React, { useEffect, useState } from 'react';
import { Search, List, Calendar, Filter, Plus, X } from 'lucide-react';
import { calendarStore } from '../../store/calendarStore';
import { formatLocalDate } from '../../utils/dateUtils';
import PlanList from '../../components/plan/PlanList';
import CalendarView from '../../components/plan/CalendarView';
import { showToast } from "../../utils/toastMessage";
import { categoryStore } from '../../components/common/CategoryStore';
import { useRouter } from 'next/navigation';
import { authStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { getMonthlyRange, getWeeklyRange } from '../../utils/dateUtils';
import { ActiveFilterChips } from '../../components/common/ActiveFilterChips';
import PlanFormModal from '../../components/plan/PlanFormModal';
import PlanDetailModal from '../../components/plan/PlanDetailModal';
import PlanFilterModal from '../../components/plan/PlanFilterModals';
import { useTimerStore } from '../../store/TimerStore';
import { TimerDetailModal } from '../../components/timer/TimerDetailModal';
import { useCategoryAction } from '../../hooks/useCategoryAction';

export default function PlanManagementPage() {
    const user = authStore(state => state.user);
    const isChecking = authStore(state => state.isChecking);
    const hasChecked = authStore(state => state.hasChecked);
    const router = useRouter();

    const { handleAddCategory, handleUpdateCategory, handleDeleteCategory } = useCategoryAction();

    const { viewType, calendarViewMode, isViewTypeReady, setViewType, initViewType } = useUIStore(); 

    // 훅은 무조건 실행 (한꺼번에 가져옴 -> 스토어 내부의 데이터가 하나만 바뀌어도 컴포넌트 리렌더링)
    const { 
        selectedDate, plans, 
        filters, setFilters, resetFilters, gridStatistics, setSelectedDate, gridFetchPlans, calendarFetchPlans,
        addPlan, updatePlan, updateStatusPlan, deletePlan, hasMore, isLoading
    } = calendarStore();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // 카테고리 리스트 받기 (페이지 진입 때 받고 이후엔 로컬 관리)
    // 페이지 렌더링 때 fetchCategories 부르기 (새 계획 추가 때 하면 필터 검색 불가)
    const categories = categoryStore((s) => s.categories);
    const fetchCategories = categoryStore((s) => s.fetchCategories);

    // 🔥 1. 타이머와 연결된 '계획' 정보를 담을 상태 추가
    const [isTimerDetailOpen, setIsTimerDetailOpen] = useState(false);
    const [selectedTimer, setSelectedTimer] = useState(null);
    const [selectedPlanForTimer, setSelectedPlanForTimer] = useState(null); 

    // 🔥 2. 타이머 클릭 핸들러 수정 (timer와 plan을 같이 받음)
    const handleTimerClick = (timer, plan) => {
        setSelectedTimer(timer);
        setSelectedPlanForTimer(plan);
        setIsTimerDetailOpen(true);
    };

    // 🔥 3. 데이터 새로고침 통합 함수 (타이머 계획 수정 시 호출됨)
    const refreshPlans = () => {
        if (viewType === 'grid') {
            gridFetchPlans();
        } else {
            const rangeData = calendarViewMode === 'weekly' 
                ? getWeeklyRange(selectedDate) 
                : getMonthlyRange(selectedDate);
            calendarFetchPlans(rangeData.startDate, rangeData.endDate, calendarViewMode);
        }
    };

    useEffect(() => {
        initViewType();
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
         // 로그인 상태 확인 중이거나 확인 끝났는데 유저 없으면 아무것도 X
        if (!hasChecked || isChecking || !user) return;
        if (!isViewTypeReady || viewType !== "grid") return;

        try {
            gridFetchPlans(); // 계획 불러옴
        } catch (error) {
            if (error.response) {
                showToast(error.response.data.message, "error");
            } else {
                console.log("계획 조회 API 오류");
                showToast(`서버에 연결되지 않습니다.`, "error");
            }
        }
    }, [hasChecked, isChecking, user, filters, isViewTypeReady, viewType]);

    useEffect(() => {
        // 로그인 상태 확인 중이거나 확인 끝났는데 유저 없으면 아무것도 X
        if (!hasChecked || isChecking || !user) return;
        if (!isViewTypeReady || viewType !== "calendar") return;

        try {
            let rangeData;

            if(calendarViewMode === 'weekly') {
                rangeData = getWeeklyRange(selectedDate);
            } else {
                // monthly
                rangeData = getMonthlyRange(selectedDate);
            }
            
            let startDate = rangeData.startDate;
            let endDate = rangeData.endDate;

            // API 호출
            calendarFetchPlans(startDate, endDate, calendarViewMode); // 계획 불러옴
        } catch (error) {
            if (error.response) {
                console.log(error.response?.data);
                showToast(error.response.data.message, "error");
            } else {
                console.log("계획 조회 API 오류");
                showToast(`서버에 연결되지 않습니다.`, "error");
            }
        }
    }, [hasChecked, isChecking, user, isViewTypeReady, viewType, calendarViewMode, selectedDate]);

    useEffect(() => {
        if (!hasChecked || isChecking || !user) return;
        
        fetchCategories();
    }, [hasChecked, isChecking, user]);

    //체크 끝났는데 유저 X
    // UX용 막기
    useEffect(() => {
        if (!hasChecked || isChecking) return; // 한 번의 로그인 검사도 안 했거나 확인 중일때
        if (!user) {// 로그인 확인 끝났지만 유저 없으면 로그인창 이동
            showToast("로그인 후 이용해 주세요", "error");
            router.replace('/login');
        }
    }, [hasChecked, isChecking, user, router]);

    // 로그인 확인 전에는 렌더링 막기 (화면 자체가 안 그려짐)
    if (!hasChecked || isChecking) {
        return <div className="flex justify-center p-10">로딩 중...</div>;
    }
    if (!user) return null;

    // 오늘 날짜~3개월 후 날짜
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    // [추가] 필터 삭제 핸들러 (X 버튼 클릭 시)
    const handleRemoveFilter = (key, valueToRemove = null) => {
        if (key === 'categories') {
            // 카테고리는 배열이므로 해당 값만 제거
            const newCats = filters.categories.filter(c => c !== valueToRemove);
            setFilters({ categories: newCats });
        } else if (key === 'status') {
            setFilters({ status: null }); // or ""
        } else if (key === 'date') {
            setFilters({ startDate: formatLocalDate(today), endDate: formatLocalDate(threeMonthsLater) });
        } else if (key === 'sort_date') {
            // 날짜 정렬 X -> 기본값 '최신순(desc)'으로 복구
            // 카테고리 정렬은 현재 상태 유지해야 함
            const currentCatSort = filters.sort.find(s => s.startsWith('category')) || 'category,asc';
            setFilters({ sort: ['date,desc', currentCatSort] });
        } 
        else if (key === 'sort_category') {
            // 카테고리 정렬 X -> 기본값 '가나다순(asc)'으로 복구
            // 날짜 정렬은 현재 상태 유지
            const currentDateSort = filters.sort.find(s => s.startsWith('date')) || 'date,desc';
            setFilters({ sort: [currentDateSort, 'category,asc'] });
        }
    };

    const planDefaultFilters = {
        startDate: formatLocalDate(today),
        endDate: formatLocalDate(threeMonthsLater),
        status: null,
        keyword: "",
        categories: [],
        sort: ['date,desc', 'category,asc']
    };

    // --- 핸들러 ---
    const handleViewChange = (viewType) => {
        setViewType(viewType);
    };

    // 상세 모달 오픈
    const openDetailModal = (plan) => {
        setSelectedPlan(plan);
        setIsEditMode(false);
        setIsDetailModalOpen(true);
    };

    // [핵심 로직] Plan 추가 시 카테고리 색상 병합
    const handleAddPlan = async (newPlanData) => { 
        console.log("page:", newPlanData);
        try {
            await addPlan(newPlanData);

            setIsAddModalOpen(false);
        } catch (error) {
            if (error.response) {
                showToast(error.response.data.message, "error");
            } else {
                console.log("계획 조회 API 오류");
                showToast(`서버에 연결되지 않습니다.`, "error");
            }
        } 
    };

    // [핵심 로직] Plan 수정 시 카테고리 색상 업데이트
    const handleUpdatePlan = async (id, updatedData) => {
        try {
            const response = await updatePlan(id, updatedData, viewType);
            
            setSelectedPlan(response); // 모달에 보이는 데이터도 갱신 (id+갱신 데이터 붙이기)
            setIsEditMode(false);
        } catch (error) {
            if (error.response) {
                showToast(error.response.data.message, "error");
            } else {
                console.log("계획 수정 API 오류");
                showToast("서버에 연결되지 않습니다.", "error");
            }
        }
    };

    const handleDeletePlan = async (id) => {
        try {
            await deletePlan(id);
            setIsDetailModalOpen(false); // 상세 모달 닫기
            showToast("계획이 삭제되었습니다.");
        } catch(error) {
            console.log("계획 삭제 실패", error);
            showToast("서버에 연결되지 않습니다.", "error");
        }
    };

    const handleToggleComplete = async (id, currentStatus, viewType) => {
        try {
            const response = await updateStatusPlan(id, currentStatus, viewType);
            
            setSelectedPlan(response); //완료 처리된 계획으로 변경
        } catch(error) {
            console.log("계획 완료 처리 실패", error);
            showToast("서버에 연결되지 않습니다.", "error");
        }
    };

    return (
    <div className="h-full flex flex-col">
        {/* 컨트롤 패널 */}
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-300">
            <div className="relative w-full md:w-auto md:flex-1">
                <input 
                    type="text" 
                    placeholder="계획 검색..." 
                    value={filters.keyword} // 스토어 상태와 동기화
                    onChange={(e) => setFilters({ keyword: e.target.value })} // 입력 시 바로 필터링
                    className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${viewType === 'grid' ? 'visible' : 'invisible'}
                    `}
                />
                <Search className={`h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400
                    ${viewType === 'grid' ? 'visible' : 'invisible'}`} />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button 
                        onClick={() => handleViewChange('grid')} 
                        className={`p-2 border-r border-gray-300 transition-colors ${viewType === 'grid' ? 'bg-gray-100 text-gray-600' : 'text-gray-400 hover:bg-gray-50'}`}
                        title="리스트 보기"
                    >
                        <List className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => handleViewChange('calendar')} 
                        className={`p-2 transition-colors ${viewType !== 'grid' ? 'bg-gray-100 text-gray-600' : 'text-gray-400 hover:bg-gray-50'}`}
                        title="캘린더 보기"
                    >
                        <Calendar className="h-5 w-5" />
                    </button>
                </div>
                
                {viewType === 'grid' && (
                    <button 
                        onClick={() => setIsFilterModalOpen(true)} 
                        className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        title="필터"
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                )}
                
                <button 
                    onClick={() => 
                        setIsAddModalOpen(true)
                    } 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>새 계획 추가</span>
                </button>
            </div>
        </div>

        {viewType === 'grid' && (
            <div className="mt-1">
                <ActiveFilterChips 
                    filters={filters} 
                    categories={categories} 
                    onRemoveFilter={handleRemoveFilter} 
                    onResetAll={resetFilters}
                    defaultFilters={planDefaultFilters}   
                />
            </div>
        )}
        
        {/* 메인 뷰 컨텐츠 */}
        <div className="flex-1 px-5 pt-4 pb-10 overflow-auto">
                {viewType === 'grid' ? (
                    <PlanList
                        gridPlans={plans}
                        statistics={gridStatistics}
                        hasMore={hasMore}
                        isLoading={isLoading}
                        onLoadMore={() => gridFetchPlans(true)} 
                        onOpenDetail={openDetailModal}
                        onTimerClick={handleTimerClick} 
                    />
                ) : (
                    <CalendarView 
                        calendarPlans={plans} 
                        currentDate={selectedDate}
                        onChangeDate={setSelectedDate}
                        onOpenDetail={openDetailModal}
                        onTimerClick={handleTimerClick}
                    />
                )}
            </div>

        {/* 모달 */}
        <PlanFormModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onSave={handleAddPlan} 
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
        />
        
        {isDetailModalOpen && selectedPlan && (
            <PlanDetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                plan={selectedPlan} 
                isEditMode={isEditMode} 
                setEditMode={setIsEditMode} 
                onUpdate={handleUpdatePlan} 
                onDelete={handleDeletePlan}
                onToggleComplete={() => handleToggleComplete(selectedPlan.id, selectedPlan.completed, viewType)} 
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
            />
        )}

        {/* 필터 모달 연결 */}
        {isFilterModalOpen && (
            <PlanFilterModal 
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)} 
                initialFilters={filters}    // 스토어의 현재 필터 상태 전달
                categories={categories}     // 전체 카테고리 목록 전달
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
            />
        )}
        
        {/* 🔥 4. 모달에 plan과 새로고침 함수(onTimerUpdate) 전달 */}
        <TimerDetailModal 
            isOpen={isTimerDetailOpen}
            onClose={() => setIsTimerDetailOpen(false)}
            timer={selectedTimer}
            categories={categories}
            plan={selectedPlanForTimer} // 선택된 계획 정보
            onTimerUpdate={refreshPlans} // 수정 완료 시 리스트 새로고침
        />
        </div>
    );
}