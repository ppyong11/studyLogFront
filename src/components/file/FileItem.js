import { useState, useEffect } from "react";
import { FileUtil } from "../../utils/fileUtil";
import { fetchFile, handleDownload } from "../../utils/api/fileApi";
import { FileText } from 'lucide-react';

export const FileItem = ({ file }) => {
    const [fileUrl, setFileUrl] = useState(null);
    const fileName = file.fileName || file.name || "알 수 없는 파일";
    const isBlack = FileUtil.isBlacklisted(fileName);
    const isImage = FileUtil.isImage(fileName);

    useEffect(() => {
        if (isBlack || !isImage || !file.id) return;

        let objectUrl = null;
        fetchFile(file.id).then(url => {
            objectUrl = url;
            setFileUrl(url);
        });

        return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
    }, [file.id, isBlack, isImage]);

    if (isBlack) return <BlackListUI fileName={fileName} />;

return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
            {/* 1. 왼쪽: 이미지 미리보기 또는 아이콘 */}
            <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {isImage ? (
                    fileUrl ? (
                        <img src={fileUrl} alt={fileName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] text-gray-400">Loading</span>
                    )
                ) : (
                    <FileText className="w-5 h-5 text-gray-500" />
                )}
            </div>

            {/* 2. 오른쪽: 파일 정보 및 다운로드 클릭 */}
            <div className="flex-1 min-w-0">
                <p 
                    onClick={() => handleDownload(file.id, fileName)}
                    className="text-sm text-gray-700 truncate cursor-pointer hover:text-blue-600 font-bold"
                >
                    {fileName}
                </p>
                <div className="flex items-center text-xs text-gray-400 space-x-2">
                    <span>{file.fileSize || '용량 확인 불가'}</span>
                    <span>•</span>
                    <span className="text-blue-500/70">클릭하여 다운로드</span>
                </div>
            </div>
        </div>
    );
};