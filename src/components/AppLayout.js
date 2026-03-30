"use client";

import { useTimerWebSocket } from "../hooks/timerWebSocket"; // 아까 만든 웹소켓 훅!

export default function AppLayout({ children }) {
    useTimerWebSocket();

    return <>{children}</>; 
}