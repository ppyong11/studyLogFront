import { useState, useEffect } from 'react';
import { parseToSeconds } from "../utils/timeUtils";

// 실행 중인 타이머가 바뀔 떄마다 수행 (부모가 이 함수 호출할 때 runningTimer 보내면 비교 시작함)
export const useTimerTicker = (runningTimer) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!runningTimer || runningTimer.status !== 'RUNNING') {
            setSeconds(parseToSeconds(runningTimer?.elapsed || "00:00:00"));
            return;
        }

        const baseElapsed = parseToSeconds(runningTimer.elapsed);
        const trackingStartTime = runningTimer._localTrackingStartTime || Date.now();

        const calculateExactSeconds = () => {
            const gapSeconds = Math.floor((Date.now() - trackingStartTime) / 1000);
            return baseElapsed + gapSeconds;
        };

        // 초기 세팅
        setSeconds(calculateExactSeconds());

        // 1000ms 대신 100ms마다 확인
        const ticker = setInterval(() => {
            const exact = calculateExactSeconds();
            // 현재 초와 계산된 초가 다를 때(1초가 딱 넘어가는 순간)만 화면 렌더링(상태 업데이트) 발생
            setSeconds((prev) => {
                if (prev !== exact) return exact;
                return prev;
            });
        }, 100);

        return () => clearInterval(ticker); // 이전에 실행한 타이머 종료
    }, [runningTimer]);

    return seconds;
};