'use client';

import { useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import BoardFormModal from '../../components/board/BoardFormModal';
import { Search, PenSquare, ChevronLeft, ChevronRight, Loader2, Trash2, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../utils/toastMessage';
import { categoryStore } from '../../components/common/CategoryStore';
import { useCategoryAction } from '../../hooks/useCategoryAction';
import { authStore } from '../../store/authStore';
import CategoryBadge from '../../components/common/CategoryBadge';
import { formatDateTime } from '../../utils/dateUtils';

export default function BoardPage() {
    const user = authStore(state => state.user);
    const isChecking = authStore(state => state.isChecking);
    const hasChecked = authStore(state => state.hasChecked);
    const router = useRouter();
    
    // 카테고리 훅 가져오기
    const { handleAddCategory, handleUpdateCategory, handleDeleteCategory } = useCategoryAction();

    // 카테고리 스토어
    const fetchCategories = categoryStore((s) => s.fetchCategories);

    // 게시판 스토어
    const { 
        boards, isLoading, page, totalPages, fetchBoards, filters, setFilters, 
        addBoard, updateBoard, deleteBoard 
    } = useBoardStore();

    // 🌟 상세 모달 관련 State 전부 삭제 완료!
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState(null); 

    // 페이지네이션 핸들러
    const handlePrevPage = () => { if (page > 1) setFilters({ page: page - 1 }); };
    const handleNextPage = () => { if (page < totalPages) setFilters({ page: page + 1 }); };

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

    // 로그인 체크
    useEffect(() => {
        if (!hasChecked || isChecking) return;
        if (!user) {
            showToast("로그인 후 이용해 주세요", "error");
            router.replace('/login');
        }
    }, [hasChecked, isChecking, user, router]);

    // 페이지 벗어날 때 필터 초기화
    useEffect(() => {
        return () => {
            setFilters({ page: 1 });
        };
    }, [setFilters]);

    if (!hasChecked || isChecking) return <div className="flex justify-center p-10">로딩 중...</div>;
    if (!user) return null;

    // 글쓰기/수정 모달 열기 핸들러
    const openWriteModal = () => {
        setSelectedBoard(null);
        setIsWriteModalOpen(true);
    };

    const openEditModal = (board) => {
        setSelectedBoard(board);
        setIsWriteModalOpen(true);
    };

    // 데이터 저장(등록/수정) 핸들러
    const handleSaveBoard = async (idOrData, editDataOrDraftId, maybeDraftId) => {
        try {
            if (selectedBoard) {
                await updateBoard(idOrData, editDataOrDraftId, maybeDraftId);
                showToast("게시글이 수정되었습니다.");
            } else {
                await addBoard(idOrData, editDataOrDraftId);
                showToast("게시글이 등록되었습니다.");
            }
            await fetchBoards();
            setIsWriteModalOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
            throw error; 
        }
    };

    // 데이터 삭제 핸들러
    const handleDeleteBoard = async (id) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteBoard(id);
            if (boards.length === 1 && page > 1) {
                setFilters({ page: page - 1 });
            } else {
                await fetchBoards();
            }
            showToast("게시글이 삭제되었습니다.");
        } catch (error) {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
        }
    };

    return (
        <div className="h-full flex flex-col">
                            {/* 1. 상단 컨트롤 패널 */}
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-300">
                <div className="relative w-full md:w-auto md:flex-1">
                    <input 
                        type="text"
                        placeholder="게시글 검색..."
                        value={filters.keyword || ''} 
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button 
                    onClick={openWriteModal}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                    <PenSquare className="w-5 h-5" />
                    <span className="font-semibold">글쓰기</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">로딩 중...</p>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <p className="text-gray-500 font-medium">작성된 게시글이 없습니다.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {boards.map((board) => (
                            <li 
                                key={board.id} 
                                // 🌟 핵심: 클릭 시 상세 페이지로 이동! (모달 아님)
                                onClick={() => router.push(`/boards/${board.id}`)}
                                title={board.content} 
                                className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer"
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <p className="text-gray-400 text-sm ml-2 font-medium py-1">
                                        {formatDateTime(board.uploadAt)}
                                    </p>
                                    <div className="flex items-center mb-1">
                                        <CategoryBadge categoryId={board.categoryId} />
                                        <h3 className="px-2 text-lg font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                            {board.title}
                                        </h3>
                                    </div>
                                </div>
                                
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openEditModal(board); }} 
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }} 
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 살려낸 페이지네이션 UI */}
            {!isLoading && boards.length > 0 && (
                <div className="flex items-center justify-center mt-8 space-x-6">
                    <button 
                        onClick={handlePrevPage} disabled={page === 1}
                        className={`p-2 rounded-lg transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <span className="text-lg font-semibold text-gray-700">
                        {page} <span className="text-gray-400 font-normal">/ {totalPages || 1}</span>
                    </span>

                    <button 
                        onClick={handleNextPage} disabled={page >= totalPages}
                        className={`p-2 rounded-lg transition-colors ${page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* 글쓰기 및 수정 모달 (상세 모달은 제거됨) */}
            {isWriteModalOpen && (
                <BoardFormModal 
                    isOpen={isWriteModalOpen} 
                    onClose={() => setIsWriteModalOpen(false)} 
                    onSave={handleSaveBoard}
                    initialData={selectedBoard}
                    board={selectedBoard}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                />
            )}
        </div>
    );
}