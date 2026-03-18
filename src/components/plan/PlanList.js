"use client";

import { Clock, Link2, Loader2 } from 'lucide-react';
import CategoryBadge from '../common/CategoryBadge';
import { formatGoalTime } from '../../utils/dateUtils';
import { useMounted } from '../../hooks/useMounted';
import { useMemo } from 'react'; // 정렬 최적화를 위해 추가 (원본 데이터가 똑같으면 이전에 정렬해 둔 결과 재사용)

const PlanList = ({ gridPlans= [], statistics, hasMore, isLoading, onLoadMore, onOpenDetail, onTimerClick }) => {
    const isMounted = useMounted();

    // 정렬 로직: 미완료가 위로, 완료가 아래로 (동일 상태일 땐 최신순)
    const sortedPlans = useMemo(() => {
        return [...gridPlans].sort((a, b) => {
            if (a.completed === b.completed) {
                // 같은 상태일 때는 ID 내림차순 (최신순)
                return Number(b.id) - Number(a.id);
            }
            // 미완료(false)가 앞으로, 완료(true)가 뒤로
            return a.completed ? 1 : -1;
        });
    }, [gridPlans]); // 데이터 들어올 때마다 수행 (같아도 수행하는데 useMemo가 메모리 기억해둠)

    if (!isMounted) return null;

    // 처음 데이터를 불러오는 중일 때 (기존 데이터가 없을 때) 로딩 뷰
    if (isLoading && gridPlans.length === 0) {
        return (
            <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="font-medium">계획을 불러오고 있습니다...</p>
            </div>
        );
    }

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
                    {sortedPlans.length > 0 ? (
                        sortedPlans.map(plan => {
                            const dateStr = plan.endDate ? <>{plan.startDate} ~<br />{plan.endDate}</> : plan.startDate;

                            return (
                                <div 
                                    key={plan.id} 
                                    onClick={() => onOpenDetail && onOpenDetail(plan)} 
                                    className="group grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    {/* 1. 이름 */}
                                    <div className={`col-span-6 pl-4 flex items-center gap-2 max-w-[500px]`}>
                                        <span className={`font-medium truncate ${plan.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {plan.name}
                                        </span>

                                        {plan.connectedTimer && (
                                            <div 
                                                className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                                                title={`연결된 타이머: ${plan.connectedTimer.name}`}
                                                onClick={(e) => { 
                                                    e.stopPropagation();
                                                    onTimerClick && onTimerClick(plan.connectedTimer, plan);
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
                                        <CategoryBadge categoryId={plan.categoryId} />
                                    </div>

                                    {/* 4. 목표 시간 */}
                                    <div className="col-span-2 text-center flex justify-center items-center gap-1 text-sm text-gray-500">
                                        <Clock className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        {formatGoalTime(plan.minutes)}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-gray-400 font-medium">등록된 계획이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* 하단: 더 불러오기 버튼 */}
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