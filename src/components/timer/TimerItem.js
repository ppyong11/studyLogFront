'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTimerStore } from '../../store/TimerStore';
import { useTimerTicker } from '../../hooks/timerTicker';
import { formatSeconds } from '../../utils/timeUtils';
import CategoryBadge from '../common/CategoryBadge';
import { 
    Play, Pause, RotateCcw, ChevronDown, ChevronUp, CalendarDays,
    Edit2, Link2Off, Trash2, Link, MoreVertical, Square 
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal'; 
import { calendarStore } from '../../store/calendarStore';

const TimerItem = ({ timer, onPlanClick, onEdit, onDelete, onReset, onControl, page  }) => { 
    const { toggleExpanded, expandedTimerId, runningTimer, syncedTimer } = useTimerStore();
    
    const isExpanded = expandedTimerId === timer.id;
    const isRunning = timer.status === 'RUNNING';
    const isEnded = timer.status === 'ENDED';

    const { updatePlanCompletedLocally } = calendarStore()
    
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: null, 
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // 이 타이머가 정말 지금 스토어에서 돌고 있는 그 타이머가 맞는지 확인
    const isThisTimerRunning = isRunning && runningTimer?.id === timer.id && runningTimer?.status === 'RUNNING';
    const liveTime = useTimerTicker(isThisTimerRunning ? runningTimer : null);

    // 백엔드의 getMinutes() 기준에 맞춰 초로 변환
    const targetTime = timer.connectedPlan?.minutes * 60; 

    const isPlanCompleted = timer.connectedPlan?.completed; // 완료 여부 필드명 확인 필요

    // 한 번만 찌르기 위한 Ref
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        // 실행 중 + 목표 시간 > 0 + 아직 계획이 완료되지 않았을 때만 감시
        if (isThisTimerRunning && targetTime && targetTime > 0 && !isPlanCompleted) {

            // 흐른 시간이 목표 시간을 뚫는 바로 그 순간
            if (liveTime >= targetTime && !hasTriggeredRef.current) {
                hasTriggeredRef.current = true; // 중복 호출 방지
                
                // 수동 동기화 API 찌르기 (백엔드가 알아서 다 해줌)
                // useEffect에서 비동기 못 써서 async 함수 만들고 사용 
                const triggerSync = async () => {
                    try {
                        await syncedTimer(timer.id);

                        updatePlanCompletedLocally(timer.connectedPlan?.id);
                    } catch (error) {
                        hasTriggeredRef.current = false; 
                    }
                };
                
                triggerSync();
            }
        } else if (!isThisTimerRunning) {
            // 타이머가 멈추면 초기화 (다시 시작할 때를 대비)
            hasTriggeredRef.current = false;
        }
    }, [liveTime, isThisTimerRunning, targetTime, timer?.id, isPlanCompleted]);

    const displayTime = isThisTimerRunning 
        ? formatSeconds(liveTime)
        : formatSeconds(timer.elapsed || 0); //pause, ended는 elapsed로 띄우기

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    // 종료 버튼 클릭 시 
    const handleEndClick = (e) => {
        e.stopPropagation();
        
        // 종료 확인 모달 띄우기
        setConfirmModal({
            isOpen: true,
            title: "타이머 종료",
            message: "타이머를 완전히 종료하시겠습니까?\n종료된 타이머는 초기화나 재실행이 불가능합니다.",
            onConfirm: async () => {
                onControl(timer.id, "end");
                setConfirmModal(prev => ({ ...prev, isOpen: false })); // 끝나면 닫기
            }
        });
    };

    const handleToggleStatus = async (e) => {
        e.stopPropagation(); 
        
        // 일시정지하는 거면 그냥 바로 API 쏘기
        if (isRunning) {
            onControl(timer.id, 'pause');
            return;
        }

        // 타이머를 시작하려고 할 때 검사 로직
        if (timer.connectedPlan?.id) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(timer.connectedPlan?.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(timer.connectedPlan?.endDate);
            end.setHours(0, 0, 0, 0);

            const isOutOfRange = today < start || today > end; // 실행 날짜가 계획 전 날이거나 마감일 이후일 때
            console.log("범위 불일치: ", isOutOfRange);

            if (isOutOfRange) {
                setConfirmModal({
                    isOpen: true,
                    title: "타이머 실행 경고",
                    message: (
                        <div className="flex flex-col gap-2 text-left">
                            <p>오늘 날짜가 연결된 계획의 진행 기간 밖입니다.</p>
                            <p className="text-sm font-bold text-red-500 mt-1">
                                지금 타이머를 실행해도 목표 달성 시 자동 완료 처리가 되지 않습니다.<br/>그래도 실행하시겠습니까?
                            </p>
                        </div>
                    ),
                    onConfirm: async () => {
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        onControl(timer.id, 'start');
                    }
                });
                return;
            }
        }

        // 통과되면 정상 실행
        onControl(timer.id, 'start');
    };

    const handleReset = (e) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: "타이머 초기화",
            message: "타이머 시간을 초기화하시겠습니까?\n계획이 연결돼 있다면 자동 완료 처리된 계획의 상태는 유지됩니다.",
            onConfirm: async () => {
                if (onReset) await onReset(timer.id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setConfirmModal({
            isOpen: true,
            title: "타이머 삭제",
            message: "타이머를 삭제하시겠습니까?\n연결된 계획은 해제됩니다.",
            onConfirm: async () => {
                if (onDelete) await onDelete(timer.id, page);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        if (onEdit) onEdit(timer);
    };

    const handlePlanClick = (e) => {
        e.stopPropagation();
        if (timer.connectedPlan?.id && onPlanClick) onPlanClick(timer.connectedPlan?.id);
    };

    const toggleMenu = (e) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <>
            <div 
                onClick={() => toggleExpanded(timer.id)}
                className={`mb-3 rounded-2xl transition-all duration-300 overflow-visible border cursor-pointer select-none relative ${
                isRunning 
                ? 'border-blue-200 shadow-lg scale-[1.01] bg-blue-50/10' 
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}>
                {/* 상단 영역 */}
                <div className={`p-5 flex justify-between items-center relative z-10`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isRunning ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-300'}`} />
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5 whitespace-nowrap"> {/* 간격 살짝 넓힘 */}
                                <div className="flex items-center text-[10px] text-gray-400">
                                    {/* 생성일 아이콘은 생략해서 공간 확보 */}
                                    <span>생성일: {timer.createAt?.split(' ')[0]}</span>
                                </div>
                                
                                <span className="text-gray-200 text-[9px]">|</span>

                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <CalendarDays size={10} className="shrink-0" /> {/* 아이콘 찌그러짐 방지 */}
                                    <span>최근 실행일: {timer.startAt ? timer.startAt.split(' ')[0] : '없음'}</span>
                                </div>
                            </div>
                            
                            <h3 className={`font-bold text-base leading-tight ${isRunning ? 'text-blue-900' : 'text-gray-700'}`}>
                                {timer.name}
                            </h3>
                            
                            <div className="mt-1 flex items-center gap-1.5 min-h-[20px]">
                                {timer.connectedPlan?.id ? (
                                    <button 
                                        onClick={handlePlanClick}
                                        className="text-[11px] text-blue-500 flex items-center gap-1 hover:underline transition-all bg-blue-50 px-1.5 py-0.5 rounded text-left max-w-[150px] truncate"
                                    >
                                        <Link size={9} />
                                        {timer.connectedPlan?.name}
                                    </button>
                                ) : (
                                    <span className="text-[10px] text-gray-300 flex items-center gap-1 px-1">
                                        <Link2Off size={10} />
                                        계획 없음
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-1">
                                <CategoryBadge categoryId={timer.categoryId} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right mr-1">
                            <div className={`font-mono text-xl font-black tracking-tight ${isRunning ? 'text-blue-600' : 'text-gray-600'}`}>
                                    {/* 서버의 elapsed가 아니라 분기 처리된 displayTime을 렌더링 */}
                                    {displayTime}
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                                {timer.status}
                            </div>
                        </div>

                        <div className="h-8 w-[1px] bg-gray-100 mx-1"></div>

                        <div className="flex flex-col items-center gap-1">
                            {/* 더보기 메뉴 버튼 */}
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={toggleMenu}
                                    className={`p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors ${isMenuOpen ? 'bg-gray-100 text-gray-600' : ''}`}
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <button 
                                            onClick={handleEditClick}
                                            className="w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2"
                                        >
                                            <Edit2 size={12} /> 수정하기
                                        </button>

                                        <button 
                                            onClick={handleDeleteClick} 
                                            className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                        >
                                            <Trash2 size={12} /> 삭제하기
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="text-gray-300 mt-1">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 확장 영역 (컨트롤러) */}
                {isExpanded && (
                    <div 
                        className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200 cursor-default"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            {/* 재생/일시정지 버튼 (종료된 상태면 비활성화) */}
                            <button 
                                onClick={handleToggleStatus}
                                disabled={isEnded}
                                className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                    isEnded
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : isRunning 
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95' 
                                        : 'bg-[#265882] hover:bg-[#1e4669] text-white active:scale-95'
                                }`}
                            >
                                {isRunning ? <><Pause size={16} fill="currentColor" /> 일시정지</> : <><Play size={16} fill="currentColor" /> 시작</>}
                            </button>
                            
                            {/* 종료 버튼 추가 (종료된 상태면 비활성화) */}
                            <button 
                                onClick={handleEndClick}
                                disabled={isEnded}
                                className={`flex-1 flex items-center justify-center border text-sm font-bold rounded-xl transition-all ${
                                    isEnded 
                                    ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed' 
                                    : 'bg-white border-red-200 text-red-500 hover:bg-red-50 active:scale-95'
                                }`}
                                title="타이머 종료"
                            >
                                <Square size={16} fill="currentColor" className="mr-1" /> 종료
                            </button>

                            {/* 초기화 버튼 (종료된 상태면 비활성화) */}
                            <button 
                                onClick={handleReset}
                                disabled={isEnded}
                                className={`flex-1 flex items-center justify-center border rounded-xl transition-all ${
                                    isEnded
                                    ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:scale-95'
                                }`}
                                title="시간 초기화"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {confirmModal.isOpen && (
                <ConfirmModal 
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={closeConfirmModal}
                />
            )}
        </>
    );
};

export default TimerItem;