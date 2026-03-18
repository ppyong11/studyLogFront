'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Edit2, Trash2, Loader2 } from 'lucide-react';
import { categoryStore } from '../../../store/CategoryStore';
import CategoryBadge from '../../../components/common/CategoryBadge';
import { formatDateTime } from '../../../utils/dateUtils';
import { showToast } from '../../../utils/toastMessage';
import BoardFormModal from '../../../components/board/BoardFormModal';
import { useBoardStore } from '../../../store/boardStore';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { FileItem } from '../../../components/file/FileItem';
import MarkdownViewer from '../../../components/common/MarkdownViewer';

export default function BoardDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; // URL에서 게시글 ID 획득

    const [board, setBoard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // 상세 페이지에서도 수정이 가능하도록 상태 관리
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { boards, updateBoard, deleteBoard, fetchBoardDetail } = useBoardStore();

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

            setBoard({ 
                ...response.board, 
                files: response.files 
            });
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
    }, [id, boards]);
    
    if (isLoading) {
        return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;
    }
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
        <div className="max-w-3l mx-auto px-5 py-5">
            <button 
                onClick={() => router.push('/boards')}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 font-semibold"
            >
                <ChevronLeft className="w-5 h-5" />
                <span>목록으로 돌아가기</span>
            </button>

            {/* 💡 2. 거대한 박스(bg-white, border, shadow)를 없애고 시원하게 풀었습니다. */}
            <article>
                
                {/* 헤더 영역 (노션 스타일) */}
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight break-keep">
                        {board.title}
                    </h1>
                    
                    {/* 정보 (카테고리, 날짜) 가로 정렬 */}
                    <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <CategoryBadge categoryId={board.categoryId} />
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-gray-500 font-medium">
                                {uploadAtStr}
                                {updatedAtStr && updatedAtStr !== uploadAtStr && ` (수정됨)`}
                            </span>
                        </div>
                    </div>
                </header>

                {/* 본문 영역 */}
                <div className="min-h-[300px] px-2">
                    <MarkdownViewer content={board.content} />
                </div>

                {/* 첨부파일 영역 */}
                {board.files && board.files.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> 
                            첨부파일 ({board.files.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {board.files.map((file) => (
                                <FileItem key={file.id} file={file} />
                            ))}
                        </div>
                    </div>
                )}

                {/* 💡 3. 수정/삭제 버튼은 본문이 끝난 뒤 우측 하단에 깔끔하게 배치 */}
                <div className="mt-16 pt-6 flex border-t border-gray-100 justify-end space-x-3">
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span>수정</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>삭제</span>
                    </button>
                </div>

            </article>

            {/* 모달들 유지 */}
            {isEditModalOpen && (
                <BoardFormModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    onSave={handleSaveEdit}
                    initialData={board}
                    boardId={board.id}
                />
            )}

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}