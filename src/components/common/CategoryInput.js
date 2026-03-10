"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Check } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { showToast } from "../../utils/toastMessage";

// 카테고리 팝업 관련 로직 (전체적인 건 store, page에서 처리하고 이건 props로 받음)

export const HEX_PALETTE = [
    { bg: '#E3E3E3', text: '#484848' }, // 회색
    { bg: '#F1E7E1', text: '#554539' }, // 갈색
    { bg: '#FFE5E5', text: '#821912' }, // 빨간색
    { bg: '#FFE7CD', text: '#72471D' }, // 주황색
    { bg: '#FCF4CC', text: '#584C12' }, // 노란색
    { bg: '#E4EFE7', text: '#134F14' }, // 초록색
    { bg: '#E4F2FD', text: '#265882' }, // 하늘색
    { bg: '#F4F2FF', text: '#652F79' }, // 보라색
    { bg: '#FFEDF5', text: '#7E1734' }, // 분홍색
    { bg: '#F7F7F7', text: '#484848' } // 기본
];

    const CategoryInput = ({ selectedCategory, categories = [], onSelect, onAdd, onUpdate, onDelete }) => {
    const [mode, setMode] = useState('select'); // 'select', 'create', 'edit'
    const [inputValue, setInputValue] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    useEffect(() => {   
        if (mode === 'edit' && selectedCategory) {
            const cat = categories.find(c => c.id === Number(selectedCategory)); // 카테고리 객체 뽑음

            if (cat) { 
                setInputValue(cat.name); 
                setSelectedColor({ bg: cat.bgColor, text: cat.textColor }); 
            }
        }
        
        if (mode === 'create') {
            setInputValue('');
            setSelectedColor(HEX_PALETTE[9]);
        }
    }, [mode, selectedCategory, categories]);

    const handleSave = () => {
        if (!inputValue.trim()) {
            showToast('카테고리명을 입력해 주세요.');
            return;
        }
        if (!selectedColor) {
            showToast('색상을 선택해 주세요.');
            return;
        }
        
        if (mode === 'create') {
            onAdd && onAdd(inputValue.trim(), selectedColor);
            onSelect && onSelect(inputValue.trim());
        } else if (mode === 'edit') {
            onUpdate && onUpdate(selectedCategory, inputValue.trim(), selectedColor);
            onSelect && onSelect(inputValue.trim());
        }
        setMode('select');
    };

    // 삭제 버튼 누르면 팝업 열림
    const handleDeleteClick = () => {
        setShowDeletePopup(true);
    };

    // 삭제 팝업에서 확인 누르면 삭제
    const handleDelete = () => {
        onDelete && onDelete(selectedCategory);
        console.log(selectedCategory);
        onSelect && onSelect(''); // 선택된 카테고리 초기화
        setMode('select');
        setShowDeletePopup(false);
    };

    if (mode === 'select') {
        return (
            <div className="flex items-center gap-2">
                <select 
                    value={selectedCategory} // react는 select 태그에 null 값 허용 X
                    onChange={(e) => {
                        console.log("선택된 카테고리: ", e.target.value);
                        onSelect && onSelect(e.target.value);
                    }} 
                    className="flex-grow p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option key="__placeholder__" value="">카테고리 선택</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option> //UI엔 name이 보임
                    ))}
                </select>
                
                {selectedCategory ? (
                    <button type="button" onClick={() => setMode('edit')} className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600" title="수정">
                        <Settings className="h-4 w-4" />
                    </button>
                ) : (
                    <button type="button" onClick={() => setMode('create')} className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100" title="추가">
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="p-3 border border-gray-300 rounded-md space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">{mode === 'create' ? '새 카테고리' : '카테고리 수정'}</span>
                {mode === 'edit' && (
                    <button type="button" onClick={handleDeleteClick} className="text-xs text-red-500 hover:bg-red-50 p-1 rounded" title="삭제">
                        삭제
                    </button>
                )}
            </div>

            {showDeletePopup && (
                <ConfirmModal 
                    title="카테고리 삭제"
                    message="해당 카테고리를 삭제하시겠습니까?"
                    onConfirm={handleDelete} 
                    onCancel={() => setShowDeletePopup(false)} 
                />
            )}
            
            <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                placeholder="카테고리명" 
                className="w-full p-2 border border-gray-300 rounded-md text-sm" 
                autoFocus 
            />

            <div>
                <p className="text-xs text-gray-500 mb-1">색상 선택</p>
                <div className="flex gap-2 flex-wrap">
                    {HEX_PALETTE.slice(0, 10).map((color, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            // ?. => null이면 false 처리 (에러X)
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor?.bg === color.bg ? 'border-gray-500 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color.bg }}
                        >
                            {selectedColor?.bg === color.bg && <Check className="w-3 h-3" style={{ color: color.text }} />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <button 
                    type="button" 
                    onClick={() => setMode('select')} 
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100">
                        취소
                </button>
                <button 
                    type="button" 
                    onClick={handleSave} 
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                        저장
                </button>
            </div>
        </div>
    );
};

export default CategoryInput;