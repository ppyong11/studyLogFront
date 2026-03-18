"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from "../utils/api/axios";
import { showToast } from '../utils/toastMessage';

export const useTimerStore = create(
    persist(
        (set, get) => ({
            timers: [],
            isLoading: false,
            page: 1,
            totalPages: 0,
            runningTimer: null, // 현재 실행 중인 타이머 (모달용, 리셋 불가)
            expandedTimerId: null,
            isFloatingVisible: false,
            setFloatingVisible: (visible) => set({ isFloatingVisible: visible }),

            // UI
            setSelectedDate: (date) => set({ selectedDate: date }),

            setRunningTimer: (timer) => set({ runningTimer: timer }),
            closeFloating: () => set({ isFloatingVisible: false, runningTimer: null }),

            // 진짜 필터 상태
            filters: {
                page: 1,
                keyword: '',
                status: '',
                startDate: null,
                endDate: null,
                categories: [],
                sort: 'date,desc'
            },

            // 필터 및 페이지 변경
            setFilters: (newFilters) => set((state) => {
                const nextPage = newFilters.page || 1;
                
                return {
                    // 기존 값에 새 필터 덮어씌우기 (병합) newFilters에 새로운 page가 있어도 변수 page가 적용됨
                    filters: { ...state.filters, ...newFilters, page: nextPage },
                    timers: [] 
                };
            }),

            resetFilters: () => set({
                page: 1,
                filters: {
                    page: 1, // 이거 없으면 필터 초기화 시 undefined 에러남
                    startDate: null,
                    endDate: null,
                    keyword: "",
                    categories: [],
                    status: '',
                    sort: 'date,desc'
                },
                timers: []
            }),

            // 아코디언 확장/축소 관리
            toggleExpanded: (id) => set((state) => ({
                expandedTimerId: state.expandedTimerId === id ? null : id
            })),
            
            // 타이머 제어 (시작, 일시정지, 종료)
            controlTimer: async (id, action) => {
                // 키값에 따옴표 생략해도 문자열로 인식함
                const actionTextMap = {
                    start: "실행",
                    pause: "일시 정지",
                    end: "종료"
                };

                // 매핑된 텍스트 가져오기 (없는 값이면 기본값 빈 문자열)
                const actionText = actionTextMap[action] || "";
                
                try {
                    // action 파라미터에는 start, pause, end 등이 들어옴
                    const response = await api.patch(`/timers/${id}/${action}`);

                    // 서버에서 바뀐 최신 상태(RUNNING, PAUSED, ENDED 중 하나)를 포함한 데이터
                    const updatedTimer = response.data; 
                    console.log("controlTimer 액션 변경: ", updatedTimer);

                    set((state) => ({
                        // 전체 목록에서 이 타이머의 데이터(상태, 경과 시간 등)를 최신으로 교체
                        timers: state.timers.map(t => 
                            String(t.id) === String(id) ? { ...t, ...updatedTimer } : t
                        ),
                        
                        // 플로팅 모달 업데이트 로직
                        // 어떤 상태든 현재 활성화된 타이머 데이터로 유지하고 현재 시간을 찍음
                        runningTimer: updatedTimer.status === 'RUNNING' 
                            ? { ...updatedTimer, _localTrackingStartTime: Date.now() } 
                            : updatedTimer,
                            
                        // 시작 액션일 때만 모달 강제 표시, 정지/종료 시에는 기존에 떠있었다면 유지
                        isFloatingVisible: action === 'start' ? true : state.isFloatingVisible    
                    }));

                    console.log("runningTimer 액션 변경:", get().runningTimer);
                    showToast("타이머가 "+actionText+"되었습니다.");

                    await get().fetchTimers();
                    return updatedTimer;
                } catch (error) {
                    console.error(`타이머 ${action} 실패:`, error);
                    showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
                }
            },

            fetchTimers: async () => {
                const { filters, isLoading } = get();
                if (isLoading) return;

                set({ isLoading: true });
                
                try {
                    const params = new URLSearchParams();

                    // 페이지 
                    params.append("page", filters.page || 1);

                    // 날짜 범위
                    if (filters.startDate) params.append("startDate", filters.startDate);
                    if (filters.endDate) params.append("endDate", filters.endDate);
                    
                    // 키워드 검사 
                    if (filters.keyword !== null && filters.keyword !== undefined && filters.keyword.trim() !== "") {
                        params.append("keyword", filters.keyword);
                    }

                    // 상태(Status) 검사 
                    if (filters.status !== null && filters.status !== undefined && filters.status !== '') {
                        params.append("status", filters.status.toString());
                    }

                    // 리스트 타입 파라미터 
                    if (filters.categories && filters.categories.length > 0) {
                        params.append("categories", filters.categories.join(","));
                    }
                
                    // 정렬 조건 (String으로 바로 전송)
                    if (filters.sort) {
                        const sortParam = Array.isArray(filters.sort) ? filters.sort.join(",") : filters.sort;
                        params.append("sort", sortParam);
                    }

                    // API 호출
                    const response = await api.get('/timers/search', { params: params });
                    const { content, totalPages } = response.data;

                    const currentRunningTimer = get().runningTimer;
                    const newRunningTimer = content.find(t => t.status === 'RUNNING');

                    // API 호출 성공했을 때만 상태 업데이트
                    set({ 
                        timers: content, 
                        totalPages: totalPages,
                        page: filters.page || 1,
                        // 목록 조회로 인해 타이머가 덮어씌워질 때도 도장 지켜내기
                        runningTimer: newRunningTimer 
                            ? {
                                ...newRunningTimer,
                                elapsed: (currentRunningTimer && String(currentRunningTimer.id) === String(newRunningTimer.id))
                                    ? currentRunningTimer.elapsed
                                    : newRunningTimer.elapsed,
                                _localTrackingStartTime: (currentRunningTimer && String(currentRunningTimer.id) === String(newRunningTimer.id) && currentRunningTimer._localTrackingStartTime)
                                    ? currentRunningTimer._localTrackingStartTime
                                    : Date.now()
                            }
                            : currentRunningTimer, // 목록에 없으면 기존 거 유지
                            
                        isFloatingVisible: !!newRunningTimer || get().isFloatingVisible,
                    });
                } catch (error) {
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchRunningTimer: async () => {
                try {
                    const response = await api.get('/timers/running'); 
                    const activeTimer = response.data;
                    
                    // 현재 스토어에 이미 돌아가고 있는 타이머 상태를 꺼냄
                    const currentRunning = get().runningTimer;

                    if (activeTimer && activeTimer.id) {
                        set({ 
                            runningTimer: activeTimer
                                ? {
                                    ...activeTimer,
                                    // String() 비교 + 서버의 이전 elapsed 덮어쓰기 방지!
                                    elapsed: (currentRunning && String(currentRunning.id) === String(activeTimer.id)) 
                                        ? currentRunning.elapsed 
                                        : activeTimer.elapsed,
                                    _localTrackingStartTime: (currentRunning && String(currentRunning.id) === String(activeTimer.id) && currentRunning._localTrackingStartTime)
                                        ? currentRunning._localTrackingStartTime
                                        : Date.now()
                                }
                                : null,

                            isFloatingVisible: true 
                        });
                    } else {
                        set({ runningTimer: null }); 
                    }
                } catch (error) {
                    set({ runningTimer: null });
                }
            },

            addTimer: async (timer) => {
                try {
                    await api.post('/timers', timer);

                    set((state) => ({
                        filters: { ...state.filters, page: 1 },
                        timers: [] 
                    }));

                    await get().fetchTimers();
                    return true;
                } catch(error) {
                    throw error;
                }
            },

            updatePlanNameInTimers: (planId, newName, categoryId) => {
                set((state) => ({
                    timers: state.timers.map(timer => 
                        String(timer.connectedPlan?.id) === String(planId) 
                        ? { 
                            ...timer, 
                            // 1. 타이머 루트 필드 업데이트 (혹시 모르니)
                            categoryId: categoryId,
                            // 2. 🔥 핵심: connectedPlan 객체 내부도 업데이트!
                            connectedPlan: {
                                ...timer.connectedPlan,
                                name: newName,
                                categoryId: categoryId
                            }
                        } 
                        : timer
                    ),
                    
                    runningTimer: String(state.runningTimer?.connectedPlan?.id) === String(planId)
                        ? { 
                            ...state.runningTimer, 
                            categoryId: categoryId,
                            connectedPlan: {
                                ...state.runningTimer.connectedPlan,
                                name: newName,
                                categoryId: categoryId
                            }
                        }
                        : state.runningTimer
                }));
            },
            updateTimer: async (id, editData) => {
                try {
                    const response = await api.patch(`/timers/${id}`, editData);
                    const updated = response.data;

                    console.log(updated);

                    set((state) => ({ 
                        timers: state.timers.map(t => 
                            Number(t.id) === Number(id) ? { ...t, ...updated } : t
                        )
                    }));

                    await get().fetchTimers();

                    return updated;
                } catch (error) {
                    console.error("타이머 수정 실패:", error); 
                    throw error;
                }
            },

            deleteTimer: async (id) => {
                try {
                    await api.delete(`/timers/${id}`);
                    set((state) => ({
                        timers: state.timers.filter((t) => String(t.id) !== String(id))
                    }));
                } catch (error) {
                    throw error;
                }
            },

            syncDeletedCategory: (deletedId, targetId) => {
                //서버에선 알아서 바뀜
                set((state) => ({
                        timers: state.timers.map(timer => 
                            String(timer.categoryId) === String(deletedId) 
                            ? { ...timer, categoryId: targetId } // 넘겨받은 '기타' ID로 교체
                            : timer
                        )
                }));
            },

            resetTimer: async (id) => {
                try {
                    await api.patch(`/timers/${id}/reset`);
                    
                    set((state) => {
                        // 리셋하려는 타이머가 실행 중인 타이머와 같다면?
                        const isRunningTarget = String(state.runningTimer?.id) === String(id);

                        return {
                            // 전체 타이머 목록에서 해당 타이머 시간 0으로 갱신 (초기화할 때마다 fetch 하긴 그러니...)
                            timers: state.timers.map(t => 
                                t.id === id ? { ...t, elapsed: 0, status: 'READY', startAt: null, pauseAt: null } : t
                            ),
                            // 실행 중인 타이머가 타겟이었다면 runningTimer를 null로 밀어버림 (중요!)
                            runningTimer: isRunningTarget ? null : state.runningTimer 
                        };
                    });
        
                } catch (error) {
                    console.log(error);
                    throw error;
                }
            },

            syncedTimer: async (id) => {
                try {
                    const response = await api.patch(`/timers/${id}/sync`);
                    const updatedTimer = response.data; // 서버에서 준 완료된 플랜이 포함된 타이머 데이터

                    // 스토어에 있는 타이머 리스트를 서버 응답 데이터로 교체
                    set((state) => ({
                        timers: state.timers.map((t) => 
                            t.id === id ? updatedTimer : t
                        ),
                        // 현재 실행 중인 타이머 정보도 동기화 (필요 시)
                        runningTimer: state.runningTimer?.id === id ? updatedTimer : state.runningTimer
                    }));

                    return updatedTimer; // 컴포넌트에서도 쓸 수 있게 리턴
                } catch (error) {
                    console.error("자동 동기화 실패:", error);
                    throw error;
                }
            }

        }),
        {
            name: "timer-store",
            partialize: (state) => ({ filters: {...state.filters, page: 1 }}),
        }
    )
);