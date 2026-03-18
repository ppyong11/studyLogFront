"use client";

import React, { useEffect, useState } from 'react';
import { Search, List, Calendar, Filter, Plus } from 'lucide-react';
import { calendarStore } from '../../store/calendarStore';
import { formatLocalDate } from '../../utils/dateUtils';
import PlanList from '../../components/plan/PlanList';
import CalendarView from '../../components/plan/CalendarView';
import { showToast } from "../../utils/toastMessage";
import { categoryStore } from '../../store/CategoryStore';
import { authStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { getMonthlyRange, getWeeklyRange } from '../../utils/dateUtils';
import { ActiveFilterChips } from '../../components/common/ActiveFilterChips';
import PlanFormModal from '../../components/plan/PlanFormModal';
import PlanDetailModal from '../../components/plan/PlanDetailModal';
import PlanFilterModal from '../../components/plan/PlanFilterModals';
import { TimerDetailModal } from '../../components/timer/TimerDetailModal';
import { useCategoryAction } from '../../hooks/useCategoryAction';
import { useTimerStore } from '../../store/TimerStore';

export default function PlanDashBoard() {
    const user = authStore(state => state.user);
    const isChecking = authStore(state => state.isChecking);
    const hasChecked = authStore(state => state.hasChecked);

    const { handleAddCategory, handleUpdateCategory, handleDeleteCategory } = useCategoryAction();

    const { fetchRunningTimer } = useTimerStore();

    useEffect(() => {
        if (user) {
            // 어느 페이지로 접속하든, 로그인만 되어있으면 무조건 돌아가는 타이머 찾아오기!
            fetchRunningTimer();
            fetchCategories();
        }
    }, [user]);

    const { viewType, calendarViewMode, setCalendarViewMode, isViewTypeReady, setViewType, initViewType, showOnlyIncomplete } = useUIStore(); 

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

    // 타이머와 연결된 계획 정보를 담을 상태 추가
    const [isTimerDetailOpen, setIsTimerDetailOpen] = useState(false);
    const [selectedTimer, setSelectedTimer] = useState(null);
    const [selectedPlanForTimer, setSelectedPlanForTimer] = useState(null); 

    // 타이머 클릭 핸들러 (timer와 plan을 같이 받음)
    const handleTimerClick = (timer, plan) => {
        setSelectedTimer(timer);
        setSelectedPlanForTimer(plan);
        setIsTimerDetailOpen(true);
    };

    const handleCloseTimerModal = () => {
        setIsTimerDetailOpen(false); 

        setTimeout(() => {
            setSelectedTimer(null);
            setSelectedPlanForTimer(null);
        }, 300); // 모달 사라지고 약 0.3초 뒤에 null 처리
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
        return () => {
            // 컴포넌트가 언마운트(나갈 때) 실행됨
            // 다른 페이지로 이동하기 직전에 키워드만 초기화
            setFilters({ keyword: "" });
        };
    }, []); // 의존성 배열을 비워두어야 페이지 진입/이탈 시 한 번씩만 작동함

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

    // 카테고리가 변경되었을 때 현재 열려있는 상세 모달의 데이터도 동기화
    useEffect(() => {
        if (isDetailModalOpen && selectedPlan) {
            // 전체 plans 목록에서 현재 선택된 계획의 최신 상태를 찾음
            const latestPlan = plans.find(p => String(p.id) === String(selectedPlan.id));
            
            // 목록의 데이터가 모달의 데이터와 다르다면 모달 데이터 갱신 (계획, 타이머 카테고리 다를 경우)
            if (latestPlan && JSON.stringify(latestPlan) !== JSON.stringify(selectedPlan)) {
                setSelectedPlan(latestPlan);
            }
        }
    }, [plans, isDetailModalOpen]); // plans 목록이 바뀔 때마다 체크

    const today = new Date();

    // 필터 삭제 핸들러 (X 버튼 클릭 시)
    const handleRemoveFilter = (key, valueToRemove = null) => {
        if (key === 'categories') {
            // 카테고리는 배열이므로 해당 값만 제거
            const newCats = filters.categories.filter(c => c !== valueToRemove);
            setFilters({ categories: newCats });
        } else if (key === 'status') {
            setFilters({ status: null }); // or ""
        } else if (key === 'date') {
            setFilters({ startDate: formatLocalDate(today), endDate: "" });
        } else if (key === 'sort_date') {
            // 날짜 정렬 X -> 기본값 최신순으로 복구
            // 카테고리 정렬은 현재 상태 유지해야 함
            const currentCatSort = filters.sort.find(s => s.startsWith('category')) || 'category,asc';
            setFilters({ sort: ['date,desc', currentCatSort] });
        } 
        else if (key === 'sort_category') {
            // 카테고리 정렬 X -> 기본값 가나다순으로 복구
            // 날짜 정렬은 현재 상태 유지
            const currentDateSort = filters.sort.find(s => s.startsWith('date')) || 'date,desc';
            setFilters({ sort: [currentDateSort, 'category,asc'] });
        }
    };

    const planDefaultFilters = {
        startDate: formatLocalDate(today),
        endDate: "",
        status: null,
        keyword: "",
        categories: [],
        sort: ['date,desc', 'category,asc']
    };

    const handleViewChange = (viewType) => {
        setViewType(viewType);
    };

    // 상세 모달 오픈
    const openDetailModal = (plan) => {
        setSelectedPlan(plan);
        setIsEditMode(false);
        setIsDetailModalOpen(true);
    };

    // 계획 추가 시 카테고리 색상 병합
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

    // 계획 수정 시 카테고리 색상 업데이트
    const handleUpdatePlan = async (id, updatedData) => {
        try {
            const response = await updatePlan(id, updatedData, viewType);
            
            setSelectedPlan(response); // 모달에 보이는 데이터도 갱신 (id+갱신 데이터 붙이기)
            setIsEditMode(false);
            
            showToast("계획이 수정되었습니다.");
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
            const response = await updateStatusPlan(id, currentStatus, viewType, showOnlyIncomplete);
            
            console.log(response);
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
                        calendarViewMode={calendarViewMode}
                        setCalendarViewMode={setCalendarViewMode}
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
        
        {/* 모달에 plan과 새로고침 함수(onTimerUpdate) 전달 */}
        <TimerDetailModal 
            isOpen={isTimerDetailOpen}
            onClose={handleCloseTimerModal}
            timer={selectedTimer}
            categories={categories}
            plan={selectedPlanForTimer} // 선택된 계획 정보
        />
        </div>
    );
}