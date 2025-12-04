export const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-gray-400/25 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                {title && <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>}
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <div className="pt-2 flex justify-end space-x-4">
                <button
                    onClick={onCancel}
                    className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                    아니오
                </button>
                <button
                    onClick={onConfirm}
                    className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    예
                </button>
                </div>
            </div>
        </div>
    );
};
