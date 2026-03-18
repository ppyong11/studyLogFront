"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { authStore } from "../../store/authStore";
import axios from 'axios';
import Link from "next/link";
import { showToast } from "../../utils/toastMessage";
import { Loader2 } from "lucide-react";

const apiUrl= process.env.NEXT_PUBLIC_API_URL;

export default function logInForm(){
    const router = useRouter();
    const setLoginSuccess= authStore((state) => state.setLoginSuccess); // 함수

    const [ isLoading, setIsLoading ] = useState(false);

    const [formData, setFormData] = useState({
        id:'',
        pw:'',
    });

    const [remember, setRemember] = useState(false);

    // 입력 값 변경 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    useEffect(() => {
        const saveId = localStorage.getItem("saveId");
        if (saveId) {
            setFormData((prev) => ({ ...prev, id: saveId }));
            setRemember(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (remember) localStorage.setItem("saveId", formData.id);
        else localStorage.removeItem("saveId");
        
        setIsLoading(true);

        try{
            const res = await axios.post(`${apiUrl}/login`, {
                id: formData.id,
                pw: formData.pw,
            }, {
                withCredentials: true, // 쿠키 받음
            });

            showToast(`${res.data.data.nickname} 님, 반가워요  😊`);
            
            console.log(res);
            setLoginSuccess(res.data.data, res.data.tokenExpiresIn);

            setTimeout(() => router.push('/'), 3);
        } catch(error){
            console.log("axios error", error);
            console.log("response", error.response);
            console.log("request", error.request);
            if (error.response) {
                showToast(error.response.data.message, "error");
            } else {
                showToast(`서버에 연결되지 않습니다.`, "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center overflow-auto py-30 select-none">
            <div className="w-full max-w-[450px] px-2">
                <h1 className="text-3xl text-center font-extrabold text-gray-900">로그인</h1>

                <form className="mt-20 bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-5 w-full mt-2">
                        <input 
                            type="text"
                            name="id"
                            placeholder="아이디"
                            value={formData.id}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            type="password"
                            name="pw"
                            placeholder="비밀번호"
                            value={formData.pw} // 🚨 꿀팁 참조: formData.password -> formData.pw 로 수정했습니다!
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={remember} 
                                onChange={(e) => setRemember(e.target.checked)}
                            /> 
                            아이디 기억하기
                        </label>

                        <button 
                            type="submit"
                            disabled={isLoading} // 로딩 중일 때 버튼 누름 방지
                            className="w-full mt-1 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> {/* 빙글빙글 도는 톱니바퀴! */}
                                    로그인 중...
                                </>
                            ) : (
                                "로그인"
                            )}
                        </button>
                        
                        {/* 인라인 요소는 마진이 적용 안 돼서 블럭처리 */}
                        <Link href="/signup" className="mt-2 inline-block text-gray-400 hover:text-indigo-600 text-sm">
                            회원가입
                        </Link> 
                    </div>
                </form>
            </div>
        </div>
    )
}
