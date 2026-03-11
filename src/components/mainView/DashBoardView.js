import PlanList from "../plan/PlanList"; 
import CalendarView from "../plan/CalendarView";
import PlanFormModal from "../plan/PlanFormModal";
import PlanDetailModal from "../plan/PlanDetailModal";

export default function DashboardView() {
    // 화면 모드 상태: 'daily' (PlanList) vs 'calendar' (CalendarView)
    const [viewMode, setViewMode] = useState("daily"); 

    // 모달 관리 상태
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [detailModalPlan, setDetailModalPlan] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // 더미 데이터 (테스트용)
    const mockCategories = [{ id: 1, name: "개발", color: "blue" }];
    const mockStatistics = { rate: "80%", total: 5, achieved: 4, message: "오늘 목표까지 1시간 남았어요! 화이팅 🔥" };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* 상단 컨트롤 영역 */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode("daily")}
                        className={`px-4 py-2 rounded-md font-bold transition-all ${viewMode === "daily" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        일간 (리스트)
                    </button>
                    <button 
                        onClick={() => setViewMode("calendar")}
                        className={`px-4 py-2 rounded-md font-bold transition-all ${viewMode === "calendar" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        주간 / 월간 (캘린더)
                    </button>
                </div>

                <button 
                    onClick={() => setIsFormModalOpen(true)}
                    className="px-5 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                >
                    + 새 계획 추가
                </button>
            </div>

            {/* 메인 뷰 렌더링 영역 */}
            <div className="min-h-[500px]">
                {viewMode === "daily" ? (
                    <PlanList 
                        gridPlans={[]} // API에서 받은 오늘 리스트 데이터
                        statistics={mockStatistics}
                        hasMore={false}
                        onOpenDetail={(plan) => setDetailModalPlan(plan)}
                        onTimerClick={(timer, plan) => console.log("타이머 클릭", timer)}
                    />
                ) : (
                    <CalendarView 
                        calendarPlans={[]} // API에서 받은 3개월치 데이터
                        currentDate={new Date()}
                        onChangeDate={(date) => console.log("날짜 변경", date)}
                        onOpenDetail={(plan) => setDetailModalPlan(plan)}
                        onTimerClick={(timer) => console.log("타이머 클릭", timer)}
                    />
                )}
            </div>

            {/* 숨겨진 모달들 */}
            <PlanFormModal 
                isOpen={isFormModalOpen}
                isEditMode={false}
                onClose={() => setIsFormModalOpen(false)}
                categories={mockCategories}
                onSave={(data) => { console.log("저장", data); setIsFormModalOpen(false); }}
            />

            <PlanDetailModal 
                isOpen={!!detailModalPlan}
                plan={detailModalPlan}
                onClose={() => { setDetailModalPlan(null); setIsEditMode(false); }}
                isEditMode={isEditMode}
                setEditMode={setIsEditMode}
                categories={mockCategories}
                onUpdate={(id, data) => console.log("수정", id, data)}
                onDelete={(id) => { console.log("삭제", id); setDetailModalPlan(null); }}
                onToggleComplete={() => console.log("완료 토글")}
            />
        </div>
    );
}