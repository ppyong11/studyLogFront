'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTimerStore } from '../../store/TimerStore'; 
import { useTimerTicker } from '../../hooks/timerTicker';
import { calendarStore } from '../../store/calendarStore';
import { X, Pause, Play } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatSeconds } from '../../utils/timeUtils';

// 네 가지 전역 상태 중 하나만 바뀌어도 재렌더링 (훅 재호출)
const FloatingTimer = () => {
    const isFloatingVisible = useTimerStore(state => state.isFloatingVisible);
    const controlTimer = useTimerStore(state => state.controlTimer);
    const closeFloating = useTimerStore(state => state.closeFloating);

    const { runningTimer, syncedTimer } = useTimerStore();
    const { updatePlanCompletedLocally } = calendarStore();


    const isRunning = runningTimer?.status === 'RUNNING';

    const hasTriggeredRef = useRef(false);
    const trackedTimerIdRef = useRef(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    // 타이머 시간 추적 훅 (runningTimer 객체 전달)
    const displayTime = useTimerTicker(runningTimer);

    // 드래그 제한 범위를 참조할 Ref (전체 화면)
    const constraintsRef = useRef(null);

    useEffect(() => {
        const plan = runningTimer?.connectedPlan;
        const targetTime = plan?.minutes * 60;
        const isPlanCompleted = plan?.completed;

        // 타이머가 바뀌면 ref 초기화 (다른 타이머로 갈아탔을 때)
        if (trackedTimerIdRef.current !== runningTimer?.id) {
            hasTriggeredRef.current = false;
            trackedTimerIdRef.current = runningTimer?.id ?? null;
        }

        if (isRunning && targetTime > 0 && !isPlanCompleted) {
            if (displayTime >= targetTime && !hasTriggeredRef.current) {
                hasTriggeredRef.current = true;

                const triggerSync = async () => {
                    try {
                        await syncedTimer(runningTimer.id);
                        updatePlanCompletedLocally(plan.id);
                    } catch {
                        hasTriggeredRef.current = false;
                    }
                };
                triggerSync();
            }
        } else if (!isRunning) {
            hasTriggeredRef.current = false;
        }
    }, [displayTime, runningTimer?.id, runningTimer?.status, runningTimer?.connectedPlan?.completed]);
    // X 버튼 클릭 핸들러
    const handleCloseClick = (e) => {
        // 드래그 이벤트 전파 방지 *클릭인데 살짝 움직이면 드래그로 인식할 수 있음
        if (e) e.stopPropagation();
        if (runningTimer.status === 'RUNNING') {
            setIsConfirmOpen(true);
        } else {
            closeFloating();
        }
    };

    // 컨펌 모달에서 확인을 눌렀을 때
    const handleConfirmClose = async () => {
        await controlTimer(runningTimer.id, 'pause');
        closeFloating(); // 스토어의 가시성 상태 false 및 runningTimer null 처리
        setIsConfirmOpen(false);
    }

    // 플로팅 모달 표시 조건: 가시성 상태가 true이고 실행 중인 타이머 데이터가 있을 때
    if (!isFloatingVisible || !runningTimer) return null;

    return (
        <>
            {/* 전체 화면 영역 내에서만 드래그 가능하도록 설정 */}
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9999]">
                <motion.div
                    drag
                    dragConstraints={constraintsRef} 
                    dragElastic={0.1}
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed bottom-10 right-10 pointer-events-auto cursor-grab active:cursor-grabbing"
                >
                    <div className="bg-white/95 backdrop-blur-md border-2 border-[#265882] p-4 rounded-3xl shadow-2xl flex items-center gap-4 min-w-[280px]">
                        {/* 타이머 정보 섹션 */}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isRunning ? 'bg-blue-600 animate-pulse' : 'bg-gray-400'}`}>
                                <span className="text-white text-sm">⏱</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#265882] opacity-60 leading-none mb-1 uppercase truncate max-w-[80px]">
                                    {runningTimer.name || 'Study Session'}
                                </p>
                                <p className="text-xl font-mono font-black text-gray-800 leading-none">
                                    {formatSeconds(displayTime)}
                                </p>
                            </div>
                        </div>

                        {/* 버튼 컨트롤러 섹션 */}
                        <div className="flex items-center gap-1 ml-auto border-l pl-3 border-gray-100">
                            {/* 실행/일시정지 버튼 */}
                            <button 
                                onClick={() => controlTimer(runningTimer.id, isRunning ? 'pause' : 'start')}
                                className={`p-2 rounded-full transition-colors ${isRunning ? 'text-orange-500 hover:bg-orange-50' : 'text-blue-600 hover:bg-blue-50'}`}
                            >
                                {isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            </button>
                            
                            {/* X 버튼: 클릭 시 컨펌 모달 호출 */}
                            <button 
                                onClick={handleCloseClick}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 별도로 분리된 ConfirmModal 연동 */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onCancel={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmClose}
                title="타이머 일시 정지"
                message="이 창을 닫으면 타이머가 일시 정지됩니다. 일시 정지하시겠습니까?"
            />
        </>
    );
};

export default FloatingTimer;