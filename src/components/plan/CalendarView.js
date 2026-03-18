import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Link2, Loader2, AlertCircle, Circle } from 'lucide-react';
import CategoryBadge from '../common/CategoryBadge';
import { useUIStore } from '../../store/uiStore';

const PlanCardContent = ({ plan, hasTimer, isFirstSegment, titleClass, onTimerClick, formatDateRange }) => {
    if (!isFirstSegment) return null;

    console.log(plan.categoryId);
    return (
        <div className="flex flex-col h-full justify-between overflow-hidden p-0.5">
            <div className="flex flex-col gap-0.5 shrink-0">
                <div className={`text-gray-800 font-bold text-[12px] leading-tight truncate ${titleClass}`}>
                    {plan.name}
                </div>
                <div className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                    {formatDateRange(plan.startDate, plan.endDate)}
                </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-auto shrink-0 pt-1">
                {hasTimer && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onTimerClick(plan.connectedTimer, plan);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-100 hover:bg-blue-100 transition-all w-fit max-w-full"
                    >
                        <Link2 size={8} />
                        <span className="truncate max-w-[80px]">{plan.connectedTimer.name}</span>
                    </div>
                )}
                <div className="flex-shrink-0">
                    <CategoryBadge categoryId={plan.categoryId} />
                </div>
            </div>
        </div>
    );
};

const CalendarView = ({ calendarPlans = [], currentDate, onChangeDate, onOpenDetail, onTimerClick, calendarViewMode, setCalendarViewMode }) => {

    const showOnlyIncomplete = useUIStore((state) => state.showOnlyIncomplete);
    const setShowOnlyIncomplete = useUIStore((state) => state.setShowOnlyIncomplete);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 100); 
        return () => clearTimeout(timer);
    }, [calendarPlans, currentDate, calendarViewMode, showOnlyIncomplete]);

    // 모든 일정 표시
    const BASE_EVENT_HEIGHT = 4.9;
    const TIMER_EXTRA_HEIGHT = 1.5;
    const EVENT_GAP = 0.4;
    const HEADER_HEIGHT = 2.5;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getActualHeight = (plan) => {
        return !!plan.connectedTimer ? BASE_EVENT_HEIGHT + TIMER_EXTRA_HEIGHT : BASE_EVENT_HEIGHT;
    };

    const changeDate = (offset) => {
        const newDate = new Date(currentDate);
        if (calendarViewMode === 'monthly') newDate.setMonth(newDate.getMonth() + offset);
        else newDate.setDate(newDate.getDate() + (offset * 7));
        onChangeDate(newDate);
    };

    const goToday = () => onChangeDate(new Date());

    const formatDateShort = (dateStr) => {
        const date = new Date(dateStr);
        return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const formatDateRange = (startStr, endStr) => {
        if (!startStr) return '';
        const start = formatDateShort(startStr);
        if (!endStr || startStr === endStr) return start;
        const end = formatDateShort(endStr);
        return `${start} ~ ${end}`;
    };

    const renderCells = () => {
        const today = new Date();
        const isMonthly = calendarViewMode === 'monthly';

        // 날짜 범위 설정
        let startDate, TOTAL_DAYS;
        if (isMonthly) {
            const firstDay = new Date(year, month, 1);
            startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            TOTAL_DAYS = 42;
        } else {
            const curr = new Date(currentDate);
            startDate = new Date(curr);
            startDate.setDate(curr.getDate() - curr.getDay());
            TOTAL_DAYS = 7;
        }
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + TOTAL_DAYS - 1);

        let eventSegments = [];
        let dayTotalHeights = Array.from({ length: TOTAL_DAYS }, () => HEADER_HEIGHT);

        if (!isLoading) {
            // 일정 필터링 및 정렬
            const currentPlans = [...calendarPlans].filter(p => {
                const pStart = new Date(new Date(p.startDate).setHours(0,0,0,0));
                const pEnd = new Date(new Date(p.endDate || p.startDate).setHours(23,59,59,999));
                const isInRange = pStart <= endDate && pEnd >= startDate;
                if (showOnlyIncomplete) return isInRange && !p.completed;
                return isInRange;
            }).sort((a, b) => {
                const startA = new Date(a.startDate);
                const startB = new Date(b.startDate);
                if (startA.getTime() !== startB.getTime()) return startA - startB;
                return (new Date(b.endDate) - startB) - (new Date(a.endDate) - startA);
            });

            // 슬롯 할당 (단순 할당)
            const daySlots = Array.from({ length: TOTAL_DAYS }, () => []);
            currentPlans.forEach(plan => {
                const pStart = new Date(plan.startDate);
                const startIndex = Math.max(0, Math.floor((new Date(pStart).setHours(0,0,0,0) - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                const pEnd = new Date(plan.endDate || plan.startDate);
                const endIndex = Math.min(TOTAL_DAYS - 1, Math.floor((new Date(pEnd).setHours(0,0,0,0) - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                
                let slotIndex = 0;
                while (true) {
                    let isSlotFree = true;
                    for (let i = startIndex; i <= endIndex; i++) {
                        if (daySlots[i][slotIndex] !== undefined) { isSlotFree = false; break; }
                    }
                    if (isSlotFree) break;
                    slotIndex++;
                }
                for (let i = startIndex; i <= endIndex; i++) daySlots[i][slotIndex] = plan.id;
            });

            // 세그먼트 생성
            currentPlans.forEach(plan => {
                const pStart = new Date(plan.startDate);
                const startIndex = Math.max(0, Math.floor((new Date(pStart).setHours(0,0,0,0) - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                const pEnd = new Date(plan.endDate || plan.startDate);
                const endIndex = Math.min(TOTAL_DAYS - 1, Math.floor((new Date(pEnd).setHours(0,0,0,0) - startDate.getTime()) / (1000 * 60 * 60 * 24)));

                for (let i = startIndex; i <= endIndex; ) {
                    const currentRow = Math.floor(i / 7);
                    const endOfRowIndex = (currentRow + 1) * 7 - 1;
                    const realSegmentEnd = Math.min(endOfRowIndex, endIndex);
                    const slotIndex = daySlots[i].indexOf(plan.id);

                    // 조건 없이 렌더링
                    if (slotIndex >= 0) {
                        const actualHeight = getActualHeight(plan);
                        let maxTopOffset = HEADER_HEIGHT;
                        
                        // 내 위에 쌓인 일정 높이 계산
                        for(let s = 0; s < slotIndex; s++) {
                            const prevPlanId = daySlots[i][s];
                            const prevPlan = currentPlans.find(p => p.id === prevPlanId);
                            maxTopOffset += (prevPlan ? getActualHeight(prevPlan) : BASE_EVENT_HEIGHT) + EVENT_GAP;
                        }

                        eventSegments.push(
                            <div
                                key={`plan-${plan.id}-seg-${i}`}
                                onClick={(e) => { e.stopPropagation(); onOpenDetail(plan); }}
                                className={`absolute px-2 py-1.5 rounded-md cursor-pointer border border-gray-200 z-10 overflow-hidden transition-all duration-300 ${plan.completed ? 'bg-gray-100 opacity-60' : 'bg-white hover:border-blue-400 hover:shadow-md'}`}
                                style={{
                                    gridColumnStart: (i % 7) + 1,
                                    gridColumnEnd: `span ${realSegmentEnd - i + 1}`,
                                    gridRowStart: isMonthly ? (currentRow + 1) : 1,
                                    top: `${maxTopOffset}rem`,
                                    height: `${actualHeight}rem`,
                                    left: '4px',
                                    right: '4px',
                                    zIndex: !!plan.connectedTimer ? 20 : 10,
                                }}
                            >
                                <PlanCardContent plan={plan} hasTimer={!!plan.connectedTimer} isFirstSegment={i === startIndex} titleClass={plan.completed ? 'line-through text-gray-500' : 'text-gray-800'} onTimerClick={onTimerClick} formatDateRange={formatDateRange} />
                            </div>
                        );
                        // 높이 갱신
                        for (let d = i; d <= realSegmentEnd; d++) {
                            dayTotalHeights[d] = Math.max(dayTotalHeights[d], maxTopOffset + actualHeight + EVENT_GAP);
                        }
                    }
                    i = realSegmentEnd + 1;
                }
            });
        } 

        // 배경 셀 생성 (가장 높은 셀에 맞춰 Row 높이 자동 조절)
        const rowMaxHeights = [];
        const ROWS_COUNT = isMonthly ? 6 : 1;
        for (let r = 0; r < ROWS_COUNT; r++) {
            let h = isMonthly ? 10 : 12; // 기본 높이
            for (let c = 0; c < 7; c++) {
                const idx = r * 7 + c;
                if (idx < TOTAL_DAYS) h = Math.max(h, dayTotalHeights[idx]);
            }
            rowMaxHeights.push(h);
        }

        const dayCells = [];
        for (let i = 0; i < TOTAL_DAYS; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            const rowIdx = Math.floor(i / 7);

            const isCurrentMonth = currentDay.getMonth() === month;
            const isToday = currentDay.toDateString() === today.toDateString();
            
            const dateTextColor = isToday 
                ? 'bg-red-500 text-white' 
                : isCurrentMonth 
                    ? 'text-gray-700' 
                    : 'text-gray-300';

            dayCells.push(
                <div key={`cell-${i}`} className={`border-gray-200 ${(i + 1) % 7 !== 0 ? 'border-r' : ''} ${(isMonthly && i < 35) ? 'border-b' : ''} p-1 bg-white relative transition-all duration-300`}
                    // 계산된 행 높이 적용 (+ 여유 공간)
                    style={{ height: `${rowMaxHeights[rowIdx] + 0.5}rem` }}
                >
                    <div className="flex justify-end p-1">
                        <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${dateTextColor}`}>
                            {currentDay.getDate()}
                        </span>
                    </div>
                </div>
            );
        }

        return <div className="grid grid-cols-7 relative auto-rows-auto bg-gray-200 gap-px border border-gray-200 rounded-b-lg overflow-hidden">{dayCells}{eventSegments}</div>;
    };

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-4 border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                        <button onClick={() => setCalendarViewMode('monthly')} className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${calendarViewMode === 'monthly' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>월간</button>
                        <button onClick={() => setCalendarViewMode('weekly')} className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${calendarViewMode === 'weekly' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>주간</button>
                    </div>

                    <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                        <button 
                            onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${
                                showOnlyIncomplete 
                                ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm' 
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {showOnlyIncomplete ? <AlertCircle size={14} /> : <Circle size={14} />}
                            {showOnlyIncomplete ? '미완료 계획만 표시 중' : '전체 계획 표시 중'}
                        </button>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">{year}년 {month + 1}월</h3>

                <div className="flex items-center gap-1">
                    <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md mr-2">오늘</button>
                    <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
                    <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight className="h-5 w-5 text-gray-600" /></button>
                </div>
            </div>

            <div className="border-t border-l border-r border-gray-200 rounded-t-lg bg-gray-50 grid grid-cols-7">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                    <div key={d} className={`text-center py-2 text-[12px] font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
                ))}
            </div>
            
            <div className="bg-white overflow-visible relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-b-lg">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-2" />
                        <p className="text-sm font-medium text-gray-500">계획을 불러오는 중입니다...</p>
                    </div>
                )}
                {renderCells()}
            </div>
        </div>
    );
};

export default CalendarView;