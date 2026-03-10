import { create } from "zustand";
import api from "../utils/api/axios";
import { persist } from "zustand/middleware";

// draftId: 게시글-파일 매핑 키
export const useBoardStore = create(
    persist(
        (set, get) => ({
            boards: [],
            isLoading: false,
            page: 1,
            totalPages: 0, //페이지네이션 처리
            totalItems: 0,

            filters: {
                page: 1,
                keyword: '',
                startDate: null,
                endDate: null,
                categories: [],
                sort: ['date, desc', 'title,asc'] // 정렬 기본값
            },

            // --- 필터 및 페이지 변경 ---
            setFilters: (newFilters) => set((state) => {
                const nextPage = newFilters.page || 1;
                
                return {
                    filters: { ...state.filters, ...newFilters, page: nextPage },
                    boards: [] 
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
                    sort: ['date,desc', 'title,asc']
                },
                boards: []
            }),

        fetchBoards: async () => {
            const { filters, isLoading } = get();
            if (isLoading) return;

            set({ isLoading: true }); //조회 시작-> loading처리

            try {
                const params = new URLSearchParams();

                params.append("page", filters.page || 1);
                if (filters.startDate) params.append("startDate", filters.startDate);
                if (filters.endDate) params.append("endDate", filters.endDate);
                if (filters.keyword !== null && filters.keyword !== undefined && filters.keyword.trim() !== "") {
                    params.append("keyword", filters.keyword);
                }
                // 5. 리스트 타입 파라미터 
                if (filters.categories && filters.categories.length > 0) {
                    params.append("categories", filters.categories.join(","));
                }
                if (filters.sort && filters.sort.length > 0) {
                    filters.sort.forEach(s => params.append("sort", s));
                }

                const response = await api.get('/boards/search', { params: params });
                
                const { content, totalPages, totalItems } = response.data; // 구조 분해 할당

                set({
                    boards: content,
                    totalPages: totalPages,
                    page: filters.page || 1, //백엔드에서 받지만 요청한 대로 갱신
                    totalItems: totalItems,
                });
            } catch (error) {
                throw error;
            } finally {
                set({ isLoading: false }); // 조회 성공하든 안 하든 로딩끝
            }
        },

        fetchBoardDetail: async (id) => {
            try {
                const response = await api.get(`/boards/${id}`);

                return response.data;
            } catch (error) {
                throw error;
            } finally {
                set({ isLoading: false });
            }
        },

        addBoard: async (board, draftId) => {
            console.log(draftId);
            try {
                await api.post('/boards', board, {
                    params: { draftId } // params는 이렇게 보냄
            });

                set((state) => ({
                    filters: { ...state.filters, page: 1 },
                    boards: [] // 초기화하고 다시 fetch 해서 갱신
                }));

                // 등록 성공 후 재조회
                await get().fetchBoards();
            } catch (error) {
                throw error;
            }
        },

        updateBoard: async (id, editData, draftId) => {
                try {
                    await api.patch(`/boards/${id}`, editData, {
                        params: { draftId }
                    });
                    
                    set((state) => ({
                        filters: { ...state.filters, page: 1 },
                        boards: []
                    }));

                    await get().fetchBoards();
                } catch (error) {
                    throw error;
                }
            },

    deleteBoard: async (id, page) => {
        try {
            await api.delete(`/boards/${id}`);
            
            set((state) => ({
                filters: { ...state.filters, page: 1 },
                boards: []
            }));

            await get().fetchBoards(); // await: 현재 api 응답 받을 때까지 기다림
        } catch (error) {
            throw error;
        }
    },
}),
        {
            name: "board-store",
            partialize: (state) => ({ filters: {...state.filters, page: 1 }}),
        }
));