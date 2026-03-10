"use client";

import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useTimerStore } from '../store/TimerStore';
import { authStore } from '../store/authStore';

export const useTimerWebSocket = () => {
    const runningTimer = useTimerStore((state) => state.runningTimer);
    const user = authStore((state) => state.user);

    const socketRefreshTrigger = authStore((state) => state.socketRefreshTrigger);

    useEffect(() => {
        console.log("WebSocket Hook Check:", { user, status: runningTimer?.status });
        
        // 로그인한 유저이고, 실행 중인 타이머가 있을 때만 웹소켓 연결
        if (!user || !runningTimer || runningTimer.status !== 'RUNNING') return;

        const socketUrl = "http://localhost:8080/api/ws-timer";

        const stompClient = new Client({
            // SockJS를 사용하여 연결 (쿠키를 포함해서 보내기 위함)
            webSocketFactory: () => new SockJS(socketUrl), // 쿠키 브라우저가 알아서 챙겨감
            connectHeaders: {},
            debug: (str) => {
                // 개발 환경에서만 로그 확인 (배포 시 주석 처리)
                console.log("[STOMP]", str);
            },
            onConnect: () => {
                console.log('웹소켓 연결 성공. 이제 창을 닫으면 서버가 알게 됨.');
            },
            onStompError: (frame) => {
                console.error('웹소켓 연결 에러:', frame);
            },
        });

        // 연결 시작
        stompClient.activate();

        // 컴포넌트가 언마운트되거나 타이머가 멈추면 연결 종료
        return () => {
            if (stompClient.active) {
                stompClient.deactivate();
            }
        };
    }, [runningTimer?.id, runningTimer?.status, user, socketRefreshTrigger]); // 타이머 상태나 유저가 바뀔 때마다 재평가
};