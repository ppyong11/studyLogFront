"use client";

export const ConfirmModal = ({ isOpen = true, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-400/50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                {title && <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>}
                <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">{message}</div>
                <div className="pt-6 flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="text-xs py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        아니오
                    </button>
                    <button
                        onClick={onConfirm}
                        className="text-xs py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        예
                    </button>
                </div>
            </div>
        </div>
    );
};