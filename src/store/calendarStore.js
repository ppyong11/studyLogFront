import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTodayString } from "../utils/dateUtils";
import { showToast } from "../utils/toastMessage";
import api from "../utils/api/axios";

export const calendarStore = create(
    persist(
        (set, get) => ({
        selectedDate: new Date(),
        
        plans: [],
        
        // 통계 데이터 받음 (ScrollPlanResponse와 매칭)
        gridStatistics: {
            total: 0,
            achieved: 0,
            rate: "0%", // 문자열 "50.0%" 등으로 옴
            totalStudyTime: "00:00:00",
            message: ""
        },

        page: 1,
        hasMore: true, // 다음 페이지가 있는지
        isLoading: false, // 로딩 상태

        // 기본 필터 상태 설정
        filters: {
            startDate: getTodayString(), // 기본값: 오늘
            endDate: getTodayString(),   // 기본값: 오늘
            categories: [],              // 빈 배열 = 전체 카테고리
            keyword: "",
            status: null,
            sort: ['date,desc', 'category,asc'] 
        },

        // UI
        setSelectedDate: (date) => set({ selectedDate: date }),

        // 필터 변경 시 (기존 데이터 버리고 새로운 검색 결과 불러옴)
        setFilters: (newFilters) => set((state) => ({
            filters: {...state.filters, ...newFilters }, // 기존 필터 유지 + 새로 들어온 값 덮어쓰기
            page: 1,
            plans: [],
            hasMore: true
        })),

        // 필터 초기화
        resetFilters: () => set({ 
            filters: { 
                startDate: getTodayString(), 
                endDate: getTodayString(),
                keyword: "",
                categories: [],
                sort: ['date,desc', 'category,asc'] 
            } 
        }),

        gridFetchPlans: async (isLoadMore = false) => {
            const { filters, page, hasMore, isLoading } = get();

            // 가져올 데이터가 없는데 더보기 요청이거나 이미 로딩 중이면 중단
            if (isLoadMore && (isLoading || !hasMore)) return;

            set({ isLoading: true });

            try {
                // 쿼리 파라미터 생성 (@RequestParam 대응)
                const params = new URLSearchParams();
                
                // 필수 파라미터
                if (filters.startDate) params.append("startDate", filters.startDate);
                if (filters.endDate) params.append("endDate", filters.endDate);
                
                // 선택 파라미터들
                if (filters.keyword !== null) {
                    params.append("keyword", filters.keyword);
                }

                // status (null이 아닐 때만 보냄)
                if (filters.status !== null && filters.status !== undefined) {
                    console.log(filters.status);
                    params.append("status", filters.status.toString());
                }

                // 리스트 타입 파라미터 (반복해서 콤마 붙이고 append)
                if (filters.categories.length > 0) {
                    params.append("categories", filters.categories.join(","));
                }
                
                // 정렬 조건
                if (filters.sort && filters.sort.length > 0) {
                    filters.sort.forEach(s => params.append("sort", s));
                }

                // 더보기 요청이면 다음 페이지, 아니면 1페이지
                const requestPage = isLoadMore ? page + 1 : 1;
                params.append("page", requestPage);

                // API 호출
                
                const response = await api.get(`plans/search`, {
                    params: params
                });

                const data = response.data;
                console.log(data);

                // API 호출 성공했을 때만 실행
                set((state) => ({
                    // 더보기면 기존 목록 뒤에 추가, 아니면 교체
                    plans: isLoadMore ? [...state.plans, ...data.plans] : data.plans,

                    // 통계 업데이트 (백엔드 값 저장)
                    gridStatistics: {
                        total: data.total,
                        achieved: data.achieved,
                        rate: data.rate,
                        totalStudyTime: data.totalStudyTime,
                        message: data.message
                    },

                    // 페이지네이션 업데이트
                    page: requestPage,
                    hasMore: data.hasNext,
                    isLoading: false
                }));

            } catch (error) {
                throw error;
            } finally {
                set({ isLoading: false });
            }
        },
        
        calendarFetchPlans: async (startDate, endDate, range) => {
            try {
                const params = new URLSearchParams();
                params.append("startDate", startDate);
                params.append("endDate", endDate);
                params.append("range", range);

                const response = await api.get(
                    `/plans/calendar`, {
                    params : params   
                });

                set({ plans: response.data });

            } catch (error) {
                throw error;
            }  
        }, 

        addPlan: async (plan) => {
            try {
                const response = await api.post(
                    '/plans',
                    plan
                );
                
                const newPlan = response.data.data; // 저장된 새 계획 받기 (date에 plan이 객체로 들어있음)
                // 기존 plans 상태 업데이트
                set((state) => {
                    const prevPlans = state.plans ?? [];
                    const prevStats = state.gridStatistics ?? { total: 0 };

                    return {
                        plans: [newPlan, ...prevPlans],
                        gridStatistics: {
                            ...prevStats,
                            total: (prevStats.total ?? 0) + 1
                        }
                    };
                });

                showToast("계획이 추가되었습니다.");
                return true;
            } catch (error) {
                throw error; // 컴포넌트에서 처리;
            }
        },

        updatePlan: async (id, updatedPlan, viewType) => {
            try {
                    const response = await api.patch(
                        `/plans/${id}`,
                        updatedPlan
                    );

                    const updated = response.data.data;
                        
                    // 리스트 업데이트용
                    set((state) => {
                        const { filters, plans } =  state;
                        
                        //필터 로직 검사
                        let shouldRemove = false;

                        // 수정된 계획에 필터가 포함되지 않으면 제거
        
                        if (filters.keyword &&
                            !updated.name.includes(filters.keyword)) {
                                shouldRemove = true;
                        }

                        if (filters.categories.length > 0) {
                            const isCategoryMatched = filters.categories.some(cat => cat.id === updated.categoryId);
                            if (!isCategoryMatched) {
                                shouldRemove = true;
                            }
                        }

                        if (shouldRemove && viewType === 'grid') {
                            return {
                                // 같은 id를 가진 Plan을 plans 배열에서 삭제
                                plans: plans.filter(p => Number(p.id) !== Number(id)),
                                gridStatistics: {
                                    ...state.gridStatistics,
                                    total: state.gridStatistics.total - 1
                                }
                            };
                        } else {
                            return {
                                    plans: state.plans.map(p => Number(p.id) === Number(id) 
                                    ? {...p, ...updated}
                                    : p)
                            };
                        }
                });

                return updated; // 모달에 최신 데이터 반영
            } catch (error) {
                throw error;
            }
        },

        updateStatusPlan: async (id, currentStatus, viewType) => {
            try {
                const response = await api.patch(
                    `/plans/${id}/complete`, 
                    null, //바디 없음 
                    {
                        params : { status: !currentStatus }
                    }
                )
                
                showToast(response.data.message);
                const updated = response.data.data;

                if (viewType === "grid") {
                    // 리스트 업데이트용
                    set((state) => {
                        const { filters, plans, gridStatistics } =  state;

                        //리스트에 있는지 확인 (중복 차감 방지)
                        const targetIndex = plans.findIndex(p => Number(p.id) === Number(id));
                        const existsInList = targetIndex !== -1;
                        
                        // 현재 걸려있는 필터와 내가 수정한 계획이 부합하는지 체크
                        const matchesFilter = filters.status === null || updated.completed === filters.status;

                        // 3. [리스트 및 통계 처리 준비]
                        let newPlans = [...plans];
                        let newTotal = gridStatistics.total;
                        // ⭐ [핵심 수정] 리스트를 세지 말고, 기존 값 기반으로 계산! ⭐
                        let newAchieved = gridStatistics.achieved; 

                        // 변경분 계산 (완료됐으면 +1, 취소됐으면 -1)
                        // 주의: 이미 완료된 걸 또 완료 누를 순 없으므로, updated.completed가 true면 +1이 맞음
                        const diff = updated.completed ? 1 : -1;

                        // Case A: 리스트에 없는데 추가됨 (부활)
                        if (!existsInList && matchesFilter) {
                            newPlans = [updated, ...plans];
                            newTotal += 1;
                            newAchieved += diff; // 통계 반영
                        }
                        // Case B: 리스트에 있었는데 조건 안 맞아서 삭제
                        else if (existsInList && !matchesFilter) {
                            newPlans = plans.filter(p => Number(p.id) !== Number(id));
                            newTotal = Math.max(0, newTotal - 1);
                            newAchieved = Math.max(0, newAchieved -1 );
                        }
                        // Case C: 리스트에 있고 조건도 맞아서 수정 (단순 상태 변경)
                        else if (existsInList && matchesFilter) {
                            newPlans = plans.map(p => Number(p.id) === Number(id) ? { ...p, ...updated } : p);
                            newAchieved += diff; // 통계 반영
                        }
                        // Case D: 리스트 밖의 일 (모달만 업데이트)
                        else {
                            return { updated };
                        }

                        // 음수 방지 안전장치
                        newAchieved = Math.max(0, newAchieved);

                        // 4. [달성률 재계산]
                        const newRate = newTotal === 0 ? "0%" : ((newAchieved / newTotal) * 100).toFixed(1) + "%";

                        return {
                            updated,
                            plans: newPlans,
                            gridStatistics: {
                                ...gridStatistics,
                                total: newTotal,
                                achieved: newAchieved,
                                rate: newRate
                            }
                        };
                });
                }
                return updated;
            } catch (error) {
                throw error;
            }
        },

        deletePlan: async (id) => {
            try {
                await api.delete(
                    `/plans/${id}`
                );
                set((state) => ({
                    plans: state.plans.filter(p => String(p.id) !== String(id))
                }));
            } catch (error) {
                throw error;
            }
        },

        getPlan: async (id) => {
            try {
                const response = await api.get(
                    `/plans/${id}`
                );

                return response.data;
            } catch (error) {
                throw error;
            }
        }
    }),
    {
        name: "calendar-store",
            partialize: (state) => ({
                filters: state.filters,
                selectedDate: state.selectedDate, // 현재 보고 있는 날짜 저장
            }),
            // Date 객체는 JSON으로 변환되면 문자열이 되므로, 다시 읽어올 때 Date 객체로 변환해주는 로직 추가
            onRehydrateStorage: () => (state) => {
                if (state && state.selectedDate) {
                    state.selectedDate = new Date(state.selectedDate);
                }
            }
}));