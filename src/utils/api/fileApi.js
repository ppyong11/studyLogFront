import api from "./axios";
import { FileUtil } from "../fileUtil";

// 서버에서 파일 데이터 Blob 형태로 받아오기 (Binary Large Object)
export const fetchFile = async (fileId) => {
    try {
        const response = await api.get(`/files/${fileId}`, {
            responseType: 'blob'
        });
        
        // 받아온 Blob 데이터를 브라우저에서 읽을 수 있는 임시 URL로 변환 (태그에 활용됨)
        const fileUrl = window.URL.createObjectURL(response.data);
        return fileUrl;
        
    } catch (error) {
        console.error("파일 불러오기 실패:", error);
        throw error;
    }
};

// 파일 다운로드 실행 함수
export const handleDownload = async (fileId, fileName) => {
    try {
        // 서버에 파일 요청
        const response = await api.get(`/files/${fileId}`, {
            responseType: 'blob'
        });
        
        // 브라우저 다운로드 처리
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob); 
        
        const link = document.createElement('a');
        link.href = url; // 다운로드할 파일 위치 지정
        link.download = fileName; // 다운로드로 처리 + 파일명 지정
        document.body.appendChild(link);
        link.click(); // 다운로드 실행
        
        // 메모리 해제 및 태그 제거
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

    } catch (error) {
        console.error("다운로드 실패:", error);
        alert("파일 다운로드 중 오류가 발생했습니다.");
    }
};

// 파일 업로드 전용 공용 함수
export const uploadTempFile = async (file, draftId) => {
    // 1. 확장자 블랙리스트 체크
    if (FileUtil.isBlacklisted(file.name)) {
        const ext = FileUtil.getExtension(file.name);
        const errorMsg = `.${ext} 형식의 파일은 보안상 업로드할 수 없습니다.`;
        
        alert(errorMsg); // 사용자에게 알림
        throw new Error(errorMsg); // 실행 중단 및 에러 투척
    }

    // 2. (선택사항) 파일 크기 체크 - 예: 10MB 제한
    const maxSize = 10 * 1024 * 1024; 
    if (file.size > maxSize) {
        alert("파일 크기는 10MB를 초과할 수 없습니다.");
        throw new Error("File size limit exceeded");
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await api.post('/files', formData, {
            params: { draftId },
        });
        return response.data;
    } catch (error) {
        console.error("파일 업로드 API 에러:", error);
        throw error;
    }
};

// 새 글 작성 중 올린 임시 파일 지우기
export const deleteTempFile = async (fileId, draftId) => {
    try {
        const response = await api.delete(`/files/${fileId}`, {
            params: { draftId } // @RequestParam 이므로 params에 담기
        });
        return response.data;
    } catch (error) {
        console.error("임시 파일 삭제 실패:", error);
        throw error;
    }
};

// 기존 게시글 수정 중 저장된 파일 지우기
export const deleteAttachedFile = async (boardId, fileId) => {
    try {
        // @PathVariable 이므로 URL에 직접 꽂아주기
        const response = await api.delete(`/boards/${boardId}/files/${fileId}`);
        return response.data;
    } catch (error) {
        console.error("기존 첨부파일 삭제 실패:", error);
        throw error;
    }
};
