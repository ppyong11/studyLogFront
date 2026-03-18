export const formatGoalTime = (minutes) => {
    if (minutes === null || isNaN(minutes) || minutes <= 0) return '00:00';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// 로컬 시간 유지
export function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 0 -> 01, 10 -> 11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getMonthlyRange(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // 이번 달 1일 구하기
    const start = new Date(year, month, 1);
    const startDayOfWeek = start.getDay();

    // 캘린더의 시작 날짜 계산
    const calendarStartDate = new Date(start);
    calendarStartDate.setDate(start.getDate() - startDayOfWeek);

    // 달력 끝 날짜 계산
    const calendarEndDate = new Date(calendarStartDate);
    calendarEndDate.setDate(calendarStartDate.getDate() + 41); 

    return {
        startDate: formatLocalDate(calendarStartDate),
        endDate: formatLocalDate(calendarEndDate),
};
}

export function getWeeklyRange(date) {
    const d = new Date(date);
    const day = d.getDay(); //0(일)~6(토)
    
    const start = new Date(d);
    start.setDate(d.getDate() - day);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
        startDate: formatLocalDate(start),
        endDate: formatLocalDate(end),
    };
}

export function formatTimeAgo(dateString) {
    if (!dateString) return "";

    // YYYY-MM-DD HH:mm:ss 형식이라면 공백을 "T"로 치환 
    const standardizedDate = typeof dateString === 'string' 
        ? dateString.replace(' ', 'T') 
        : dateString;

    const date = new Date(standardizedDate);

    // 날짜가 유효하지 않으면(NaN) 원본 문자열이나 에러 표시
    if (isNaN(date.getTime())) {
        console.error("날짜 변환 실패:", dateString);
        return "-"; 
    }

    const now = new Date();
    const diff = (now - date) / 1000; // 초 단위 차이

    // 미래의 시간이면 (서버 시간 차이 등) '방금 전' 처리
    if (diff < 0) return "방금 전";

    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    
    // 7일 이상 지나면 날짜로 표시 (MM.DD)
    return `${date.getMonth() + 1}.${date.getDate()}`;
}

// 타이머 계획 검색용
export const formatPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return "";

    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    // 같은 연도일 경우: 뒤쪽 연도 생략
    if (startYear === endYear) {
        return `${startYear.slice(2)}.${startMonth}.${startDay} - ${endMonth}.${endDay}`;
    }

    // 다른 연도일 경우: 전체 표시
    return `${startYear.slice(2)}.${startMonth}.${startDay} - ${endYear.slice(2)}.${endMonth}.${endDay}`;
};

// D-Day 계산 유틸
export const getDDay = (endDate) => {
    if (!endDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "D+"+Math.abs(diffDays);
    if (diffDays === 0) return "D-Day";
    return "D-"+diffDays;
};

// 날짜와 시간까지 모두 표시 (예: 2026. 03. 02. 14:30)
export const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const standardizedDate = typeof dateString === 'string' 
        ? dateString.replace(' ', 'T') 
        : dateString;

    const date = new Date(standardizedDate);

    if (isNaN(date.getTime())) return '-';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day} ${hours}:${minutes}`;
};