export default function LandingView({ onLoginClick }) {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gray-50">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                공부의 흐름을 <span className="text-blue-600">완벽하게</span> 타세요
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl">
                수많은 탭과 노트를 오갈 필요 없습니다. 타이머, 진척도, 그리고 목표를 하나의 앱에서 가장 직관적으로 관리하세요.
            </p>
            <button 
                onClick={onLoginClick}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-lg font-bold shadow-lg transition-transform hover:-translate-y-1"
            >
                1초만에 로그인하고 시작하기
            </button>
            
            {/* 앱 목업 들어갈 자리 */}
            <div className="mt-16 w-full max-w-4xl h-80 bg-white border border-gray-200 rounded-xl shadow-2xl flex items-center justify-center text-gray-400">
                [여기에 예쁜 캘린더/리스트 앱 목업 스크린샷 렌더링]
            </div>
        </div>
    );
}