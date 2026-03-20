'use client';

// 플랜에서 타이머 누르면 나오는 모달 
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    X, Play, Pause, RotateCcw, 
    CalendarDays, Target } from 'lucide-react';
import { useTimerStore } from '../../store/TimerStore';
import { useTimerTicker } from '../../hooks/timerTicker';
import { formatSeconds } from '../../utils/timeUtils';
import CategoryBadge from '../common/CategoryBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { showToast } from '../../utils/toastMessage';
import { calendarStore } from '../../store/calendarStore';

export const TimerDetailModal = ({ isOpen, onClose, timer: initialTimer, plan }) => {
    const { controlTimer } = useTimerStore();
    const { timers, resetTimer, syncedTimer } = useTimerStore();
    
    const { updatePlanCompletedLocally } = calendarStore()

    // 스토어(timers)에서 실시간으로 이 타이머의 최신 데이터를 찾음
    // Reset이 실행되어 스토어의 elapsed가 0이 되면, 이 timer 변수도 즉시 0이 된 객체를 가리킴
    const timer = timers.find(t => String(t.id) === String(initialTimer?.id)) || initialTimer;

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: null, 
    });

    // 실시간 상태 추적
    const runningTimer = useTimerStore(state => state.runningTimer);
    const isRunning = runningTimer?.id === timer?.id && runningTimer?.status === 'RUNNING';
    const liveTime = useTimerTicker(isRunning ? runningTimer : null);

    // displayTime 계산 
    const displayTime = isRunning 
        ? formatSeconds(liveTime) 
        : formatSeconds(timer?.elapsed || 0);

    if (!isOpen || !timer) return null;

    const handleToggleStatus = async () => {
        console.log("액션 바뀌기 전 러닝 타이머:", runningTimer);
        try {
            const action = runningTimer?.status === 'RUNNING' ? 'pause' : 'start';
            await controlTimer(timer.id, action);

            console.log("DetailModal 동기화 후 액션 변경 요청:", timer.id, action);

            console.log("액션 바뀐 후 러닝 타이머:", runningTimer);
        } catch (error) { console.error(error); }
    };


    const handleResetTimer = async (id) => {
        try {
            await resetTimer(id);

            console.log(displayTime);
            showToast("타이머가 초기화되었습니다.");
            
        } catch (error) {
            console.log(error);
            showToast(error.response?.data?.message || "서버에 연결되지 않습니다.", "error");
        }
    };

    const handleReset = (e) => {
        e.stopPropagation();
        
        setConfirmModal({
            isOpen: true,
            title: "타이머 초기화",
            message: "타이머 시간을 초기화하시겠습니까?\n계획이 연결돼 있다면 자동 완료 처리된 계획의 상태는 유지됩니다.",
            onConfirm: async () => {
                await handleResetTimer(timer.id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden relative z-10"
            >
                {/* 헤더 섹션: 그라데이션 배경 */}
                <div className={`p-8 pb-12 text-white transition-colors duration-500 ${isRunning ? 'bg-blue-600' : 'bg-[#265882]'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <CategoryBadge categoryId={timer.categoryId} />
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black mb-1 truncate">{timer.name}</h2>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <CalendarDays size={14} />
                        <span>생성일: {timer.createAt?.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <CalendarDays size={14} />
                        <span> 최근 실행일: 
                            {timer.startAt 
                                ? ` ${timer.startAt.split(' ')[0]}` 
                                : ' 실행된 적 없음'}
                        </span>
                    </div>
                </div>

                {/* 바디 섹션: 시간 표시 및 정보 */}
                <div className="px-8 -mt-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col items-center">
                        <div className={`font-mono text-5xl font-black tracking-tighter mb-1 ${isRunning ? 'text-blue-600' : 'text-gray-700'}`}>
                            {displayTime}
                        </div>
                        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isRunning ? 'text-blue-400 animate-pulse' : 'text-gray-300'}`}>
                            {timer.status}
                        </span>
                    </div>
                </div>

                <div className="p-8 pt-6 space-y-6">
                    {/* 연결된 계획 정보 */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Target size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Connected Plan</p>
                            <p className="text-sm font-bold text-gray-700 truncate">{plan?.name || "연결된 계획 없음"}</p>
                        </div>
                    </div>

                    {/* 조작 버튼 */}
                    <div className="flex gap-3">
                        <button 
                            onClick={handleToggleStatus}
                            className={`flex-[3] flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}
                        >
                            {isRunning && runningTimer?.status === 'RUNNING' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            {isRunning && runningTimer?.status === 'RUNNING' ? '일시 정지' : '시작'}
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 hover:text-gray-600 transition-all"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {confirmModal.isOpen && (
                <ConfirmModal 
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={closeConfirmModal}
                />
            )}
        </div>
    );
};