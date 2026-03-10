import api from "./axios";

// 서버에서 파일 데이터 Blob 형태로 받아오기 (Binary Large Object)
export const fetchFile = async (fileId) => {
    try {
        const response = await api.get(`/files/${fileId}`, {
            responseType: 'blob'
        });
        
        // 받아온 Blob 데이터를 브라우저에서 읽을 수 있는 임시 URL로 변환
        const fileUrl = window.URL.createObjectURL(response.data);
        return fileUrl;
        
    } catch (error) {
        console.error("파일 불러오기 실패:", error);
        throw error;
    }
};

// 파일 업로드 전용 공용 함수
export const uploadTempFile = async (file, draftId) => {
    console.log(draftId);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await api.post('/files', formData, {
            params: { draftId },
        });
        return response.data; // 성공 응답 반환
    } catch (error) {
        console.error("파일 업로드 API 에러:", error);
        throw error; // 에러는 컴포넌트로 던져서 처리하게 함
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
