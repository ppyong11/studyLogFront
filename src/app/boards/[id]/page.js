'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Edit2, Trash2, Loader2 } from 'lucide-react';
import { categoryStore } from '../../../components/common/CategoryStore';
import CategoryBadge from '../../../components/common/CategoryBadge';
import { formatDateTime } from '../../../utils/dateUtils';
import { showToast } from '../../../utils/toastMessage';
import BoardFormModal from '../../../components/board/BoardFormModal';
import { useBoardStore } from '../../../store/boardStore';
import { ConfirmModal } from '../../../components/common/ConfirmModal';

export default function BoardDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; // URL에서 게시글 ID 획득!

    const [board, setBoard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // 상세 페이지에서도 수정이 가능하도록 상태 관리
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { updateBoard, deleteBoard, fetchBoardDetail } = useBoardStore();

    const fetchCategories = categoryStore((s) => s.fetchCategories);
    const categories = categoryStore((s) => s.categories);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: null, onCancel: null 
    });
    
    // 상세 데이터 불러오기
    const handleFetchBoardDetail = async () => {
        try {
            // 백엔드에 단건 조회 API(GET /boards/{id})가 있다고 가정합니다.
            const response = await fetchBoardDetail(id);
            console.log(response);

            setBoard(response.board);
        } catch (error) {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
            router.replace('/boards'); // 에러 시 목록으로 쫓아내기
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (categories.length === 0) fetchCategories();
        if (id) handleFetchBoardDetail();
    }, [id]);

    if (isLoading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;
    if (!board) return null;

    const uploadAtStr = formatDateTime(board.uploadAt);
    const updatedAtStr = board.updatedAt ? formatDateTime(board.updatedAt) : null;

    // 상세 페이지 안에서의 저장 및 삭제 로직
    const handleSaveEdit = async (boardId, boardData, draftId) => {
        try {
            await updateBoard(boardId, boardData, draftId);
            showToast("게시글이 수정되었습니다.");
            setIsEditModalOpen(false);
            handleFetchBoardDetail(); // 수정 후 화면 데이터 새로고침
        } catch {
            showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
        }
    };

    const handleDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: "게시글 삭제",
            message: "정말 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    await deleteBoard(id);
                    showToast("게시글이 삭제되었습니다.");
                    router.push('/boards');
                } catch (error) {
                    showToast(error.response?.data?.message || `서버에 연결되지 않습니다.`, "error");
                }
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* 뒤로 가기 버튼 */}
            <button 
                onClick={() => router.push('/boards')}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 font-semibold"
            >
                <ChevronLeft className="w-5 h-5" />
                <span>목록으로</span>
            </button>

            {/* 본문 영역 (이전 모달 디자인과 동일하게 시원하게 배치) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                
                {/* 헤더 */}
                <div className="border-b border-gray-100 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-5 mt-2">
                        {board.title}
                    </h1>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
                            <span>작성: {uploadAtStr}</span>
                            {updatedAtStr && updatedAtStr !== uploadAtStr && (
                                <>
                                    <span className="text-gray-300">|</span>
                                    <span>수정: {updatedAtStr}</span>
                                </>
                            )}
                        </div>
                        <div>
                            <CategoryBadge categoryId={board.categoryId} />
                        </div>
                    </div>
                </div>

                {/* 본문 */}
                <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[200px]">
                    {board.content}
                </div>

                {/* 첨부파일 */}
                {board.files && board.files.length > 0 && (
                    <div className="mt-12 pt-6 border-t border-gray-100 bg-gray-50 rounded-xl p-6">
                        <h4 className="text-sm font-bold text-gray-800 mb-4">첨부파일 ({board.files.length})</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {board.files.map((file) => (
                                <li key={file.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
                                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 수정/삭제 버튼 그룹 */}
                <div className="mt-10 pt-6 flex justify-end space-x-3">
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span>수정</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>삭제</span>
                    </button>
                </div>
            </div>

            {/* 상세 페이지 내의 수정 모달 */}
            {isEditModalOpen && (
                <BoardFormModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    onSave={handleSaveEdit}
                    initialData={board}
                    boardId={board.id}
                />
            )}

            {/* 모달 내부에서 if(!isOpen) null 둬서 계속 렌더링돼도 true가 아니면 안 뜸  */}
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                // 취소 버튼 누르면 isOpen만 false로 닫아줌
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}