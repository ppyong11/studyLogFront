// 초 단위를 "HH:mm:ss" 형식으로 변환
export const formatSeconds = (totalSeconds) => {
    // 숫자가 아닌 값이 들어올 경우를 대비한 방어 로직
    const validSeconds = Number(totalSeconds) || 0; 
    
    const h = Math.floor(validSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((validSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (validSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

// "HH:mm:ss" 형식을 초 단위로 변환
export const parseToSeconds = (timeString) => {
    if (!timeString) return 0;

    // 이미 숫자형(초 단위)으로 들어왔다면 그대로 반환
    if (typeof timeString === 'number') {
        return timeString;
    }

    // 문자열이 아닌 이상한 객체가 들어오면 0 반환 (에러 방지)
    if (typeof timeString !== 'string') {
        return 0;
    }

    // 문자열일 때만 split 실행
    const [h, m, s] = timeString.split(':').map(Number);
    
    // NaN(Not a Number) 방지를 위해 || 0 처리
    return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
};