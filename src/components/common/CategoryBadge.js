"use client";

import React from 'react';
import { categoryStore } from '../../store/CategoryStore';

const CategoryBadge = ({ categoryId }) => {
    const categories = categoryStore((state) => state.categories);

    const findCategory = categoryId ? categories.find(c => String(c.id) === String(categoryId)) : null;
    

    const displayName = findCategory?.name;
    const displayBg = findCategory?.bgColor;
    const displayText = findCategory?.textColor;


    if (!displayName) return <span className="text-gray-300 text-xs">-</span>;

    return (
        <span 
            className={`px-2 py-1 rounded-md text-xs font-medium truncate inline-block`}
            style={{ 
                backgroundColor: displayBg, 
                color: displayText 
            }}
        >
            {displayName}
        </span>
    );
};

export default CategoryBadge;