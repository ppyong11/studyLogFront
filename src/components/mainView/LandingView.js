'use client';

import { useRouter } from 'next/navigation';

export default function LandingView() {
    const router = useRouter();

    return (
        <div className="w-full min-h-screen bg-[#FDFBF7] text-slate-800 overflow-x-hidden selection:bg-blue-200">

            <main className="w-full max-w-5xl mx-auto px-6 py-16 flex flex-col space-y-32">
                
                {/* 메인 인트로 */}
                <section className="flex flex-col items-center text-center mt-8">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.3] text-slate-800">
                        공부도, 일상도 <br className="md:hidden" />
                        <span className="text-blue-500">나만의 페이스</span>로
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 max-w-xl font-medium leading-relaxed">
                        하루 일정과 공부 기록, 집중 타이머, 다이어리까지! <br className="hidden md:block" />
                        모두 STUDY LOG에서 관리해 보세요.
                    </p>
                    
                    <div className="w-full mt-8 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                        <img 
                            src="/images/list-screenshot.png" 
                            alt="메인 리스트 화면" 
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </section>
                {/* 타이머 기능 소개 */}
                <section className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="text-4xl mb-4">⏱️</div>
                        <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                            집중하고 싶은 <br /> 순간을 위한 타이머
                        </h2>
                        <p className="text-[17px] text-slate-600 font-medium leading-relaxed">
                            계획을 누르고 타이머를 시작해 보세요! <br/>
                            내가 정한 목표 시간에만 온전히 몰입할 수 있어요.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <img 
                            src="/images/timer-screenshot.png"
                            alt="타이머 화면" 
                            className="w-100 rounded-3xl shadow-2xl border border-gray-100"
                        />
                    </div>
                </section>

                {/* 게시글 */}
                <section className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 flex justify-center">
                        <img 
                            src="/images/code-screenshot.png" 
                            alt="노트 화면" 
                            className="w-full rounded-2xl shadow-xl border border-gray-100"
                        />
                    </div>
                    <div className="order-1 md:order-2 md:pl-8">
                        <div className="text-4xl mb-4">✍️</div>
                        <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                            오늘 배운 지식도, <br />나의 감정도 기록하기
                        </h2>
                        <p className="text-[17px] text-slate-600 font-medium leading-relaxed">
                            게시글을 활용해 복잡한 개념을 깔끔하게 정리하고, 때로는 나만의 일기장으로 예쁘게 꾸며보세요. 
                        </p>
                    </div>
                </section>

                {/* 자동 알림 기능 */}
                <section className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="text-4xl mb-4">📮</div> 
                        <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                            중요한 순간엔 <br />제때 알려주는 알림
                        </h2>
                        <p className="text-[17px] text-slate-600 font-medium leading-relaxed">
                            계획한 시간이 끝나거나 목표를 달성하면 실시간으로 알려드려요. <br/>
                            일일이 체크할 필요 없이 마음 편히 집중하세요.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <img 
                            src="/images/notification-screenshot.png" 
                            alt="알림 화면" 
                            className="w-90 rounded-2xl shadow-xl border border-gray-100"
                        />
                    </div>
                </section>

                {/* 하단 로그인 */}
                <section className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-extrabold mb-8 text-slate-800">
                        지금 바로 나만의 로그를 시작해볼까요?
                    </h2>
                    <button 
                        onClick={() => router.push('/login')}
                        className="px-10 py-5 font-bold text-xl text-white bg-slate-800 hover:bg-slate-900 rounded-full transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
                    >
                        STUDY LOG 시작하기
                    </button>
                    <p className="mt-6 text-sm text-slate-400 font-medium">
                        매일 조금씩 성장하는 나를 기록해 보세요.
                    </p>
                </section>
                
            </main>
        </div>
    );
}