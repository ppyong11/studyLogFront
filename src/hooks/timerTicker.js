import { useState, useEffect } from 'react';
import { formatSeconds, parseToSeconds } from "../utils/timeUtils";

export const useTimerTicker = (runningTimer) => {
    // 현재 화면에 보여줄 초 단위 시간
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!runningTimer || runningTimer.status !== 'RUNNING') {
            // 실행 중이 아니면 DB에 저장된 값으로 초기화
            setSeconds(parseToSeconds(runningTimer?.elapsed || "00:00:00"));
            return;
        }

        // 초기값 설정
        setSeconds(parseToSeconds(runningTimer.elapsed));

        // 1초마다 1씩 증가
        const ticker = setInterval(() => {
        setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(ticker); // 컴포넌트 언마운트 시 정리
    }, [runningTimer]);

    return formatSeconds(seconds);
};