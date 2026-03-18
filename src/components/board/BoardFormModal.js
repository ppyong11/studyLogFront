'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { showToast } from '../../utils/toastMessage';
import { uploadTempFile, deleteTempFile, deleteAttachedFile } from '../../utils/api/fileApi';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import CategoryInput from '../common/CategoryInput';
import { useCategoryAction } from '../../hooks/useCategoryAction';
import { categoryStore } from '../../store/CategoryStore';
import { ConfirmModal } from '../common/ConfirmModal';

const WysiwygEditor = dynamic(() => import('./WysiwygEditor'), { 
    ssr: false, 
    loading: () => <div className="h-[450px] bg-gray-100 animate-pulse rounded-md flex items-center justify-center text-gray-400">에디터 로딩 중...</div> 
});

export default function BoardFormModal({ isOpen, onSave, onClose, initialData = null }) {
    const isEditMode = !!initialData;
    const isFetching = isEditMode && !initialData?.title;
    const [draftId] = useState(() => crypto.randomUUID());
    
    const categories = categoryStore((s) => s.categories);
    const { handleAddCategory, handleUpdateCategory, handleDeleteCategory } = useCategoryAction();
    
    const [title, setTitle] = useState(initialData?.title || '');
const [content, setContent] = useState(initialData?.content || '');
const [category, setCategory] = useState(initialData?.categoryId || '');
const [files, setFiles] = useState(initialData?.files?.map(f => ({ ...f, isTemp: false })) || []);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: null, 
    });

    const fileInputRef = useRef(null);

    // 모달이 열리거나 초기 데이터가 바뀔 때 값 세팅
    useEffect(() => {
        if (isOpen) {
            setTitle(initialData?.title || '');
            setContent(initialData?.content || '');
            setCategory(initialData?.categoryId || ''); 
            setFiles(initialData?.files?.map(f => ({ ...f, isTemp: false })) || []);
        }
    }, [isOpen, initialData]);

    console.log("기존 게시글:", initialData);
    if (!isOpen) return null;

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        try {
            const response = await uploadTempFile(selectedFile, draftId); 
            const fileData = response.data; 

            setFiles(prev => [
                ...prev, 
                { 
                    id: fileData.id,        
                    fileName: fileData.fileName, 
                    url: fileData.url,      
                    isTemp: true 
                }
            ]);

            showToast("파일이 첨부되었습니다.");
        } catch (error) {
            showToast("업로드 실패", "error");
        } finally {
            e.target.value = ''; 
        }
    };

const handleImageUpload = async (blob, callback) => {
    try {
        const response = await uploadTempFile(blob, draftId);
        console.log("📥 서버 응답 데이터:", response.data); 

        // 백엔드에서 주는 이미지 URL 꺼내기
        let imageUrl = response.data.url; 
        const altText = response.data.fileName || 'image';

        if (!imageUrl) {
            showToast("이미지 주소를 불러오지 못했습니다.", "error");
            return;
        }

        // 주소가 http로 시작하지 않는 상대 경로라면
        if (!imageUrl.startsWith('http')) {
            const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            
            imageUrl = `${backendBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }

        callback(imageUrl, altText);
        
    } catch (error) {
        console.error("이미지 업로드 에러:", error);
        showToast("이미지 업로드에 실패했습니다.", "error");
    }
};


    const handleDeleteFile = (fileId, isTemp) => {
        // 삭제 확인받고 진행
        setConfirmModal({
            isOpen: true,
            title: "파일 삭제",
            message: "이 파일을 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    if (isEditMode && !isTemp) {
                        await deleteAttachedFile(initialData.id, fileId);
                    } else {
                        await deleteTempFile(fileId, draftId);
                    }
                    setFiles(prev => prev.filter(f => f.id !== fileId));
                    showToast("파일이 삭제되었습니다.");
                } catch (error) {
                    showToast("삭제 실패", "error");
                } finally {
                    // 모달 무조건 닫기
                    closeConfirmModal();
                }
            }
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) return showToast("카테고리를 선택해주세요.", "error");
        if (!title.trim() || !content?.trim()) return showToast("제목과 내용을 입력해주세요.", "error");

        setIsSubmitting(true);
        try {
            const boardData = { title, content, categoryId: Number(category) }; 
            
            if (isEditMode) {
                await onSave(initialData.id, boardData, draftId);
            } else {
                await onSave(boardData, draftId);
            }
        } catch (error) {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = () => {
        if (title.trim() || content?.trim() || files.length > 0) {
            setConfirmModal({
                isOpen: true,
                title: "작성 취소",
                message: "작성 중인 내용은 저장되지 않습니다. 정말 나가시겠습니까?",
                onConfirm: () => {
                    closeConfirmModal();
                    onClose(); 
                }
            });
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {isFetching ? (
                    <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                        <p className="font-medium text-gray-600">게시글 데이터를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <>
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">{isEditMode ? '게시글 수정' : '새 게시글 작성'}</h2>
                            <button type="button" onClick={handleCancelClick} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 본문 (스크롤 영역) */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30 custom-scrollbar">
                            <form id="board-form" onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* 1. 카테고리 */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
                                    <CategoryInput 
                                        selectedCategory={category} 
                                        categories={categories} 
                                        onSelect={setCategory} 
                                        onAdd={handleAddCategory} 
                                        onUpdate={handleUpdateCategory} 
                                        onDelete={handleDeleteCategory} 
                                    />
                                </div>

                                {/* 2. 제목 */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="게시글의 제목을 입력하세요"
                                    />
                                </div>
                                {/* 위지윅 에디터 */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
                                    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                        <WysiwygEditor 
                                            content={content} 
                                            onChange={setContent} 
                                            onImageUpload={handleImageUpload} // 이미지 업로드
                                        />
                                    </div>
                                </div>
                                
                                {/* 4. 첨부 파일 */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">첨부파일</label>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    
                                    <div className="bg-white border border-gray-300 rounded-xl p-4">
                                        <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 border-dashed rounded-lg text-gray-600 hover:bg-gray-100 transition-colors w-full justify-center font-medium">
                                            <UploadCloud className="w-5 h-5" />
                                            <span>클릭하여 파일 업로드</span>
                                        </button>
                                        
                                        {files.length > 0 && (
                                            <ul className="mt-3 space-y-2">
                                                {files.map(file => (
                                                    <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                                        <span className="text-sm font-medium text-gray-700 truncate">{file.fileName}</span>
                                                        <button type="button" onClick={() => handleDeleteFile(file.id, file.isTemp)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* 버튼 */}
                        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-white rounded-b-2xl">
                            <button type="button" onClick={handleCancelClick} className="px-6 py-2.5 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                취소
                            </button>
                            <button type="submit" form="board-form" disabled={isSubmitting} className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:bg-blue-300 transition-colors flex items-center">
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isSubmitting ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </>
                )}
            </div>

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