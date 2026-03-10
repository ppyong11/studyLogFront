'use client';

import { X, FileText, Edit2 } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import CategoryBadge from '../common/CategoryBadge';

export default function BoardDetailModal({ isOpen, onClose, board, onEdit }) {
    if (!isOpen || !board) return null;

// 🌟 작성일, 수정일 포맷팅
    const uploadAtStr = formatDateTime(board.uploadAt);
    const updatedAtStr = board.updatedAt ? formatDateTime(board.updatedAt) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* 🌟 1. 헤더 위아래 패딩을 py-4 -> py-6으로 늘려서 안정감 부여 */}
                <div className="flex items-start justify-between px-8 py-3 border-b border-gray-100">
                    <div className="flex-1 pr-4">
                        
                        {/* 🌟 2. 제목 아래에 mb-4 (마진 바텀)를 줘서 밑의 정보들과 분리 */}
                        <h2 className="text-2xl font-bold text-gray-900 break-words leading-tight mb-4 mt-1">
                            {board.title}
                        </h2>
                        
                        {/* 🌟 3. 날짜와 뱃지 사이의 간격을 space-y-2 -> space-y-3으로 살짝 넓힘 */}
                        <div className="flex flex-col space-y-1">
                            
                            {/* 🌟 4. 불필요하게 들어갔던 py-1 삭제 (위아래 정렬을 어긋나게 함) */}
                            <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
                                <span>작성: {uploadAtStr}</span>
                                {updatedAtStr !== null && (
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

                    {/* 닫기 버튼 */}
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 px-8 py-3 overflow-y-auto">
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {board.content}
                    </div>

                    {/* 첨부파일 영역 */}
                    {board.files && board.files.length > 0 && (
                        <div className="mt-10 pt-6 border-t border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800 mb-3">첨부파일 ({board.files.length})</h4>
                            <ul className="space-y-2">
                                {board.files.map((file) => (
                                    <li key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 truncate cursor-pointer hover:text-blue-600 transition-colors">
                                            {file.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 푸터 영역: 수정 버튼 */}
                <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
                    <button 
                        onClick={() => onEdit(board)} 
                        className="flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span>수정하기</span>
                    </button>
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}