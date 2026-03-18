import { create } from "zustand";
import api from "../utils/api/axios";
import { showToast } from "../utils/toastMessage";
import { calendarStore } from "./calendarStore";
import { useTimerStore } from "./TimerStore";
import { useBoardStore } from "./boardStore";

export const categoryStore = create((set, get) => ({
    // 다른 컴포넌트에서 사용

    categories: [],
    isLoading: false,

    // 전체 조회
    fetchCategories: async () => {
        set({ isLoading: true });

        try {
            const response = await api.get('/categories');

            set({ categories: response.data });
        } catch (error) {
            console.log(error);
            if (error.response) {
                showToast(error.response.data.message, "error");
            } else {
                console.log("카테고리 조회 API 오류");
                showToast(`서버에 연결되지 않습니다.`, "error");
            } 
        } finally {
            set({ isLoading: false });
        }
    },

    // 카테고리 추가
    addCategory: async (name, color) => {
        console.log(color);
        try {
            const payload = { 
                name, 
                bgColor: color.bg, 
                textColor: color.text 
            };
            const response = await api.post(
                '/categories',
                payload 
            );
            
            // 서버에서 생성된 객체(ID 포함)를 받아와서 리스트에 추가 (다시 fetchCategories 할 필요 X)
            set((state) => ({ 
                categories: [...state.categories, response.data.data] 
            }));

        } catch (error) {
            console.error("카테고리 추가 실패:", error);
            throw error;
        }
    },

    // 카테고리 수정
    updateCategory: async (id, newName, color) => {
        console.log(color);
        try {
            const payload = { 
                name: newName, 
                bgColor: color.bg,
                textColor: color.text
            };
            
            const response = await api.patch(
                `/categories/${id}`,
                payload
            );
            const updatedData = response.data.data;
            
            // 로컬 상태 업데이트
            set((state) => ({
            categories: state.categories.map(cat => 
                // String으로 형변환하여 안전하게 비교
                String(cat.id) === String(id) 
                ? { 
                    ...cat, 
                    name: updatedData.name || newName, 
                    bgColor: updatedData.bgColor || color.bg, 
                    textColor: updatedData.textColor || color.text 
                }
                : cat
            )
        }));
        } catch (error) {
            // 컴포넌트에서 토스트 처리
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            
            // 삭제된 카테고리 제외한 목록 업데이트 
            const updatedCategories = get().categories.filter(cat => String(cat.id) !== String(id));
            
            set({ categories: updatedCategories });

            // 남은 카테고리 목록에서 기본 카테고리 찾음
            const etcCategory = updatedCategories.find(cat => cat.name === '기타');
            
            if (etcCategory) {
                // 기본 카테고리 id로 삭제된 카테고리를 가진 아이템들 동기화
                calendarStore.getState().syncDeletedCategory(id, etcCategory.id);
                useTimerStore.getState().syncDeletedCategory(id, etcCategory.id);
                useBoardStore.getState().syncDeletedCategory(id, etcCategory.id);
            }

            showToast("카테고리가 삭제되어 해당 카테고리와 연결된 아이템들이 기타 카테고리로 변경되었습니다.");
        } catch (error) {
            showToast("카테고리 삭제에 실패했습니다.", "error");
        }
    },

    // 기본 카테고리 찾기 (예: "기타")
    getDefaultCategory: () => {
        const { categories } = get();
        return categories.find(c => c.name === "기타");
    }
}));
