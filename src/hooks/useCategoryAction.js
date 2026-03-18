import { categoryStore } from "../store/CategoryStore"; 
import { showToast } from "../utils/toastMessage";

export const useCategoryAction = () => {
    const { addCategory, updateCategory, deleteCategory } = categoryStore();

    const handleAddCategory = async (name, colorObj) => {
        try {
            await addCategory(name, colorObj);
            showToast("카테고리가 추가되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleUpdateCategory = async (id, newName, newColorObj) => {
        try {
            await updateCategory(id, newName, newColorObj);
            showToast("카테고리가 수정되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        } 
    };

    const handleDeleteCategory = async (id) => {
        try {
            await deleteCategory(id);
            showToast("카테고리가 삭제되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    // 완성된 3개의 함수를 객체로 묶어서 반환
    return { 
        handleAddCategory, 
        handleUpdateCategory, 
        handleDeleteCategory 
    };
};