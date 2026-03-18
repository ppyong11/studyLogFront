'use client';

import { useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import BoardFormModal from '../../components/board/BoardFormModal';
import { BoardFilterModal } from '../../components/board/BoardFilterModal';
import { Search, PenSquare, ChevronLeft, ChevronRight, Loader2, Trash2, Edit2, Filter, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../utils/toastMessage';
import { categoryStore } from '../../store/CategoryStore';
import { useCategoryAction } from '../../hooks/useCategoryAction';
import { authStore } from '../../store/authStore';
import CategoryBadge from '../../components/common/CategoryBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export default function BoardPage() {
    const user = authStore(state => state.user);
    const isChecking = authStore(state => state.isChecking);
    const hasChecked = authStore(state => state.hasChecked);
    const router = useRouter();
    
    const { handleAddCategory, handleUpdateCategory, handleDeleteCategory } = useCategoryAction();
    const fetchCategories = categoryStore((s) => s.fetchCategories);
    const categories = categoryStore((s) => s.categories);

    const { boards, isLoading, page, totalPages, fetchBoards, filters, setFilters, resetFilters, addBoard, updateBoard, deleteBoard } = useBoardStore();

    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState(null); 
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

    // 스토어의 현재 정렬 상태를 변수로 추출
    const sortList = filters.sort || ['date,desc', 'title,asc'];
    const dateOrder = sortList.find(s => s.startsWith('date'))?.split(',')[1] || 'desc';
    const titleOrder = sortList.find(s => s.startsWith('title'))?.split(',')[1] || 'asc';

    // 정렬 즉시 적용 핸들러
    const toggleDateSort = () => {
        const newDateOrder = dateOrder === 'desc' ? 'asc' : 'desc';
        setFilters({ sort: [`date,${newDateOrder}`, `title,${titleOrder}`] });
    };

    const toggleTitleSort = () => {
        const newTitleOrder = titleOrder === 'desc' ? 'asc' : 'desc';
        setFilters({ sort: [`date,${dateOrder}`, `title,${newTitleOrder}`] });
    };

    const handlePrevPage = () => { if (page > 1) setFilters({ page: page - 1 }); };
    const handleNextPage = () => { if (page < totalPages) setFilters({ page: page + 1 }); };

    // 로그인 체크
    useEffect(() => {
        if (!hasChecked || isChecking) return;
        if (!user) {
            showToast("로그인 후 이용해 주세요", "error");
            router.replace('/login');
        }
    }, [hasChecked, isChecking, user, router]);

    // 초기 데이터 로딩 
    useEffect(() => {
        if (!hasChecked || isChecking || !user) return;
        try {
            fetchCategories();
            fetchBoards();
        } catch (error) {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
        }
    }, [hasChecked, isChecking, user, filters]);

    // 페이지 벗어날 때 필터 및 키워드 초기화
    useEffect(() => {
        return () => {
            setFilters({ keyword: "", page: 1 });
        };
    }, [setFilters]);

    // 글쓰기/수정 모달 등 핸들러
    const openWriteModal = () => { setSelectedBoard(null); setIsWriteModalOpen(true); };
    const openEditModal = (board) => { setSelectedBoard(board); setIsWriteModalOpen(true); };
    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const handleSaveBoard = async (idOrData, editDataOrDraftId, maybeDraftId) => {
        try {
            if (selectedBoard) await updateBoard(idOrData, editDataOrDraftId, maybeDraftId);
            else await addBoard(idOrData, editDataOrDraftId);
            showToast(selectedBoard ? "게시글이 수정되었습니다." : "게시글이 등록되었습니다.");
            await fetchBoards();
            setIsWriteModalOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
            throw error; 
        }
    };

    const executeDelete = async (id) => {
        try {
            await deleteBoard(id);
            const currentPage = filters.page || 1;
            if (boards.length === 1 && currentPage > 1) {
                setFilters({ page: currentPage - 1 }); 
            } else {
                await fetchBoards();
            }
            showToast("게시글이 삭제되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
        } finally {
            closeConfirmModal();
        }
    };

    const handleDeleteBoard = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "게시글 삭제",
            message: "정말 이 게시글을 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.",
            onConfirm: () => executeDelete(id),
        });
    };

    if (!hasChecked || isChecking) return <div className="flex justify-center p-10">로딩 중...</div>;
    if (!user) return null;

    return (
        <div className="h-full flex flex-col">
            {/* 1. 상단 컨트롤 패널 */}
            <div className="p-4 flex flex-col gap-3 border-b border-gray-300">
                <div className="flex items-center justify-between gap-4">
                    {/* 검색 바 */}
                    <div className="relative w-full md:flex-1">
                        <input 
                            type="text"
                            placeholder="게시글 검색..."
                            value={filters.keyword || ""} 
                            onChange={(e) => setFilters({ keyword: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    
                    {/* 필터 & 글쓰기 버튼 */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsFilterModalOpen(true)}
                            className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${filters.categories?.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                            title="카테고리 필터"
                        >
                            <Filter className="h-5 w-5" />
                            {filters.categories?.length > 0 && <span className="text-xs font-bold">{filters.categories.length}</span>}
                        </button>
                        <button 
                            onClick={openWriteModal}
                            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm"
                        >
                            <PenSquare className="w-4 h-4" />
                            <span className="font-semibold whitespace-nowrap">글쓰기</span>
                        </button>
                    </div>
                </div>

                {/* 🌟 정렬 컨트롤 (메인 화면 노출) */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleDateSort}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${dateOrder === 'desc' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        날짜 {dateOrder === 'desc' ? <ArrowDownWideNarrow size={14} /> : <ArrowUpNarrowWide size={14} />}
                    </button>
                    <button 
                        onClick={toggleTitleSort}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${titleOrder === 'asc' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        가나다 {titleOrder === 'asc' ? <ArrowDownWideNarrow size={14} /> : <ArrowUpNarrowWide size={14} />}
                    </button>
                </div>
            </div>

            {/* 리스트 영역 */}
            <div className="bg-white rounded-xl overflow-hidden min-h-[400px]">
                {/* ... 리스트 렌더링 코드는 기존과 동일하게 유지 ... */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">로딩 중...</p>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <p className="py-20 text-center text-gray-400 font-medium">작성된 게시글이 없습니다.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {boards.map((board) => (
                            <li 
                                key={board.id} 
                                onClick={() => router.push(`/boards/${board.id}`)}
                                title={board.content} 
                                className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer"
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <p className="text-gray-400 text-xs ml-2 font-medium py-1">
                                        {formatDateTime(board.uploadAt)}
                                    </p>
                                    <div className="flex items-center mb-1 gap-2">
                                        <CategoryBadge categoryId={board.categoryId} />
                                        <h3 className="text-base font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                            {board.title}
                                        </h3>
                                    </div>
                                </div>
                                
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(board); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 페이지네이션 UI */}
            {!isLoading && boards.length > 0 && (
                <div className="flex items-center justify-center mt-6 mb-8 space-x-6">
                    <button onClick={handlePrevPage} disabled={page === 1} className={`p-2 rounded-lg transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700">{page} <span className="text-gray-400 font-normal">/ {totalPages || 1}</span></span>
                    <button onClick={handleNextPage} disabled={page >= totalPages} className={`p-2 rounded-lg transition-colors ${page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* 모달 3종 세트 */}
            {isWriteModalOpen && (
                <BoardFormModal 
                    isOpen={isWriteModalOpen} 
                    onClose={() => setIsWriteModalOpen(false)} 
                    onSave={handleSaveBoard}
                    initialData={selectedBoard}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                />
            )}
            
            {isFilterModalOpen && (
                <BoardFilterModal 
                    isOpen={isFilterModalOpen} 
                    onClose={() => setIsFilterModalOpen(false)} 
                    filters={filters}
                    setFilters={setFilters}
                    resetFilters={resetFilters}
                    categories={categories}
                />
            )}
            
            {confirmModal.isOpen && (
                <ConfirmModal 
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={closeConfirmModal}
                />
            )}
        </div>
    );
}