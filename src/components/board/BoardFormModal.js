'use client';

import { useState, useRef, useEffect } from 'react';
import { showToast } from '../../utils/toastMessage';
import { uploadTempFile, deleteTempFile, deleteAttachedFile } from '../../utils/api/fileApi';
import { categoryStore } from '../../components/common/CategoryStore'; // 🔥 카테고리 스토어 임포트
import { X, UploadCloud, FileText } from 'lucide-react';
import CategoryInput from '../common/CategoryInput';

export default function BoardFormModal({ isOpen, onSave, onClose, initialData = null, onAddCategory, onUpdateCategory, onDeleteCategory }) {
    const isEditMode = !!initialData;
    const [draftId] = useState(() => crypto.randomUUID());

    // 스토어에서 카테고리 배열 꺼내기
    const categories = categoryStore((s) => s.categories);

    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    
    // 초기값이 있으면 사용하고, 없으면 카테고리 목록의 첫 번째 값을 기본값으로 세팅
    const [category, setCategory] = useState(initialData?.categoryId || (categories.length > 0 ? categories[0].id : ''));
    const [files, setFiles] = useState(initialData?.files?.map(f => ({ ...f, isTemp: false })) || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef(null);

    // 카테고리 목록이 뒤늦게 로딩될 경우를 대비해 첫 번째 카테고리로 기본값 보정
    useEffect(() => {
        if (!category && categories.length > 0) {
            setCategory(categories[0].id);
        }
    }, [categories, category]);

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        try {
            const uploadedFileId = await uploadTempFile(selectedFile, draftId); 
            setFiles(prev => [...prev, { id: uploadedFileId, name: selectedFile.name, isTemp: true }]);
            showToast("파일이 첨부되었습니다.");
        } catch (error) {
            showToast("업로드 실패", "error");
        } finally {
            e.target.value = ''; 
        }
    };

    const handleDeleteFile = async (fileId, isTemp) => {
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) return showToast("카테고리를 선택해주세요.", "error");
        if (!title.trim() || !content.trim()) return showToast("제목과 내용을 입력해주세요.", "error");

        setIsSubmitting(true);
        try {
            // 백엔드가 요구하는 데이터 형식에 맞게 전송
            const boardData = { title, content, category };
            
            if (isEditMode) {
                await onSave(initialData.id, boardData, draftId);
            } else {
                await onSave(boardData, draftId);
            }
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
                    <h2 className="text-xl font-bold">{isEditMode ? '수정하기' : '글쓰기'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
                    <form id="board-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* 🌟 카테고리 선택 영역 추가 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                            <CategoryInput 
                                selectedCategory={category} 
                                categories={categories} 
                                onSelect={setCategory} 
                                onAdd={onAddCategory} 
                                onUpdate={onUpdateCategory} 
                                onDelete={onDeleteCategory} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md space-y-3"
                                placeholder="제목을 입력하세요"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                className="w-full p-3 border border-gray-300 rounded-md space-y-3 resize-none"
                                placeholder="내용을 입력하세요"
                            />
                        </div>
                        
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center space-x-2 px-4 py-2 border border-dashed rounded-lg hover:bg-gray-50">
                                <UploadCloud className="w-5 h-5" />
                                <span>파일 선택</span>
                            </button>
                            <ul className="mt-4 space-y-2">
                                {files.map(file => (
                                    <li key={file.id} className="flex justify-between p-2 bg-white border border-gray-300 rounded-lg shadow-sm">
                                        <span className="text-sm truncate">{file.name}</span>
                                        <button type="button" onClick={() => handleDeleteFile(file.id, file.isTemp)}><X className="w-4 h-4 text-gray-400" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-300 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 rounded-lg">취소</button>
                    <button type="submit" form="board-form" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300">
                        {isSubmitting ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}