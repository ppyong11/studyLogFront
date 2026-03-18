'use client';

import { useLayoutEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

export const BoardFilterModal = ({ isOpen, onClose, filters, setFilters, categories }) => {

    const [localSelectedCats, setLocalSelectedCats] = useState([]);

    // 모달이 열릴 때 스토어 값으로 카테고리만 초기화
    useLayoutEffect(() => {
        if (isOpen) {
            setLocalSelectedCats(filters?.categories || []);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleApply = () => {
        // 정렬 건드리지 않고 카테고리만 업데이트 (부모 fetch 실행됨)
        setFilters({
            categories: localSelectedCats
        });
        onClose();
    };

    const handleToggleCat = (catId) => {
        if (localSelectedCats.includes(catId)) {
            setLocalSelectedCats(localSelectedCats.filter(id => id !== catId));
        } else {
            setLocalSelectedCats([...localSelectedCats, catId]); 
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-400/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col max-h-[80vh] overflow-hidden">
                
                <div className="p-5 border-b border-gray-300 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-semibold">카테고리 필터</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-5 flex-1">
                    {categories.length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-8">카테고리가 없습니다.</p>
                    )}
                    
                    {categories.length > 0 && (
                        <div className="h-[240px] pr-1"> 
                            <Virtuoso
                                style={{ height: '100%' }} // 부모의 240px 높이를 꽉 채움
                                className="custom-scrollbar"
                                data={categories}
                                computeItemKey={(index, item) => `${item.id}-${item.bgColor}`}
                                itemContent={(index, c) => (
                                    <label
                                        key={c.id}
                                        className="flex items-center space-x-3 p-2.5 rounded hover:bg-gray-50 cursor-pointer select-none border border-transparent hover:border-gray-100 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={localSelectedCats.includes(c.id)}
                                            onChange={() => handleToggleCat(c.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                        />
                                        <span
                                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm shrink-0"
                                            style={{ backgroundColor: c.bgColor || c.bg }}
                                        />
                                        <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
                                    </label>
                                )}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                    <button onClick={() => setLocalSelectedCats([])} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                        초기화
                    </button>
                    <button onClick={handleApply} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                        적용하기
                    </button>
                </div>
            </div>
        </div>
    );
};