"use client";

import { Clock, Link2 } from 'lucide-react';
import CategoryBadge from '../common/CategoryBadge';
import { formatGoalTime } from '../../utils/dateUtils';
import { useMounted } from '../../hooks/useMounted';

// store에서 직접 가져옴
const PlanList = ({ gridPlans= [], statistics, hasMore, isLoading, onLoadMore, onOpenDetail, onTimerClick }) => {
    const isMounted = useMounted();

    if (!isMounted) return null;

    return (
        <div className="space-y-4">
            {/* 상단: 목표 달성률 */}
            <div className="text-right text-sm text-gray-600">
                <span className="font-semibold">🏆 목표 달성률: </span>
                <span className="font-bold text-blue-600">{statistics.rate}</span>
                <span className="text-gray-500"> (총 {statistics.total > 0 ? statistics.total : 0}개 중 {statistics.achieved > 0 ? statistics.achieved : 0}개 완료)</span>
            <div className="text-xs text-blue-500">{statistics.message}</div>
            </div>
            
            {/* 메인 리스트 컨테이너 */}
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                {/* 헤더 */}
                <div className="grid grid-cols-12 gap-4 bg-gray-50 p-4 font-semibold text-sm text-gray-600 border-gray-300 border-b">
                    <div className="col-span-6 pl-4">계획 이름</div>
                    <div className="col-span-2">날짜</div>
                    <div className="col-span-2">분류</div>
                    <div className="col-span-2 text-center">목표 시간</div>
                </div>

                
                {/* 목록 */}
                <div className="divide-y divide-gray-100">
                    {gridPlans && gridPlans.map(plan => {
                        const dateStr = plan.endDate ? <>{plan.startDate} ~<br />{plan.endDate}</> : plan.startDate;

                        return (
                            <div 
                                key={plan.id} 
                                onClick={() => onOpenDetail && onOpenDetail(plan)} 
                                className="group grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                {/* 1. 이름 */}
                                <div className={`col-span-6 pl-4 flex items-center gap-2 max-w-[500px]`}>
                                        
                                        {/* 계획 이름 */}
                                        <span className={`font-medium truncate ${plan.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {plan.name}
                                        </span>

                                    {plan.connectedTimer && (
                                        <div 
                                            className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                                            title={`연결된 타이머: ${plan.connectedTimer.name}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // 계획 상세 모달 안 뜨게 방지
                                                // 타이머 수정을 위한 핸들러 호출
                                                onTimerClick && onTimerClick(plan.connectedTimer, plan); // 부모한테 타이머 데이터 전달
                                            }}
                                        >
                                            <Link2 size={10} />
                                            <span className="hidden sm:inline max-w-[100px] truncate">
                                                {plan.connectedTimer.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* 2. 날짜 */}
                                <div className="col-span-2 text-xs text-gray-500 leading-tight">
                                    {dateStr}
                                </div>
                                
                                {/* 3. 카테고리 */}
                                <div className="col-span-2">
                                    <CategoryBadge 
                                        categoryId={plan.categoryId} 
                                    />
                                </div>

                                {/* 4. 목표 시간 */}
                                <div className="col-span-2 text-center flex justify-center items-center gap-1 text-sm text-gray-500">
                                    <Clock className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    {formatGoalTime(plan.minutes)}
                                </div>
                            </div>
                        );
                    })}

                    {(!gridPlans || gridPlans.length === 0) && (
                        <div className="p-8 text-center text-gray-400 text-sm">등록된 계획이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* 하단: 더 불러오기 버튼 */}
            {/* 데이터가 있고, 더 불러올 페이지가 있을 때만 노출 */}
            {hasMore && gridPlans.length > 0 && (
                <button 
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="w-full py-3 bg-white border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                            불러오는 중...
                        </>
                    ) : (
                        '더 불러오기'
                    )}
                </button>
            )}
        </div>
    );
};

export default PlanList;