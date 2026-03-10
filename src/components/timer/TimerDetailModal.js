'use client';

// 플랜에서 타이머 누르면 나오는 모달 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    X, Edit3, Trash2, Play, Pause, RotateCcw, 
    CalendarDays, Target } from 'lucide-react';
import { useTimerStore } from '../../store/TimerStore';
import { useTimerTicker } from '../../hooks/timerTicker';
import { formatSeconds } from '../../utils/timeUtils';
import CategoryBadge from '../common/CategoryBadge';
import { TimerFormModal } from './TimerModal'; // 기존 수정 폼 모달
import { showToast } from '../../utils/toastMessage';

export const TimerDetailModal = ({ isOpen, onClose, timer, categories, plan, onTimerUpdate }) => {
    const { controlTimer, updateTimer, deleteTimer } = useTimerStore();
    const [isEditMode, setIsEditMode] = useState(false);
    
    // 실시간 시간 추적
    const isRunning = useTimerStore(state => state.runningTimer?.id === timer?.id);
    const runningTimer = useTimerStore(state => state.runningTimer);
    const liveTime = useTimerTicker(isRunning ? runningTimer : null);
    
    const displayTime = isRunning ? formatSeconds(liveTime) : formatSeconds(timer?.elapsed || 0);

    console.log('timerModal:', plan);
    if (!isOpen || !timer) return null;

    // --- 핸들러 ---
    const handleToggleStatus = async () => {
        try {
            const action = isRunning ? 'pause' : 'start';
            await controlTimer(timer.id, action);
        } catch (error) { console.error(error); }
    };

    const handleReset = async () => {
        if(window.confirm("시간을 초기화하시겠습니까?")) {
            await updateTimer(timer.id, { elapsed: 0 });
        }
    };

    const handleDelete = async () => {
        if(window.confirm("이 타이머를 삭제하시겠습니까?")) {
            await deleteTimer(timer.id);
            onClose();
        }
    };

    if (isEditMode) {
        return (
            <TimerFormModal 
                isOpen={isOpen}
                onClose={() => setIsEditMode(false)}
                onSave={async (id, data) => {
                    // 1. 타이머 정보(연결된 계획 C로 변경 등)를 서버에 업데이트
                    await updateTimer(id, data);
                    
                    setIsEditMode(false);
                    
                    // 2. ✨ 핵심: 뒤에 있는 계획 리스트 화면을 즉시 새로고침!
                    // (A계획에서는 타이머가 떨어지고, C계획에 타이머가 붙은 최신 상태를 서버에서 가져옴)
                    if (onTimerUpdate) {
                        onTimerUpdate();
                    }

                    // 3. (UX 디테일) 만약 원래 열고 들어왔던 A계획과 연결이 끊어졌다면?
                    // 타이머 상세창 자체를 아예 닫아버리는 것이 자연스럽습니다.
                    if (data.planId !== plan?.id) {
                        onClose(); // 모달 완전 종료
                        showToast("다른 계획으로 타이머가 이동되었습니다.");
                    }
                }}
                initialData={timer}
                initialDataPlan={plan}
                categories={categories}
            />
        );
    }

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
                            {isRunning ? 'Counting Now' : 'Status: Paused'}
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
                            <p className="text-sm font-bold text-gray-700 truncate">{plan.name || "연결된 계획 없음"}</p>
                        </div>
                    </div>

                    {/* 조작 버튼 */}
                    <div className="flex gap-3">
                        <button 
                            onClick={handleToggleStatus}
                            className={`flex-[3] flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}
                        >
                            {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            {isRunning ? '일시 정지' : '시작'}
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 hover:text-gray-600 transition-all"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>

                    {/* 하단 관리 버튼 */}
                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={() => setIsEditMode(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <Edit3 size={14} /> 정보 수정
                        </button>
                        <div className="w-px h-4 bg-gray-200 self-center" />
                        <button 
                            onClick={handleDelete}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                            <Trash2 size={14} /> 타이머 삭제
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};