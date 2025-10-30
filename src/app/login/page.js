'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AppLayout from "../../components/AppLayout";
import Link from "next/link";

const apiUrl= process.env.NEXT_PUBLIC_API_URL;

export default function logInForm(){
    const router = useRouter();

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

    useEffect( () => {
        const saveId = localStorage.getItem("saveId");
        if (saveId) {
            setFormData(prev => ({ ...prev, id: saveId }));
            setRemember(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (remember) localStorage.setItem("saveId", formData.id);
        else localStorage.removeItem("saveId");
        
        try{
            const res = await axios.post(`${apiUrl}/login`, {
                id: formData.id,
                pw: formData.pw,
            });
            
            alert(res.data.message);
            router.push('/');
        } catch(error){
            if (error.response) {
                alert(error.response.data.message);
            } else {
                alert(`서버에 연결되지 않습니다.`);
            }
        }
    };

    return (
    <AppLayout>
        <div className="min-h-screen flex justify-center overflow-auto py-30 select-none">
            <div className="w-full max-w-[450px] px-2">
            <h1 className="text-3xl text-center font-extrabold text-gray-900">로그인</h1>

            <form className="mt-20 bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
                <div className="space-y-5 w-full mt-2">
                        <input 
                            type="text"
                            name="id"
                            placeholder="아이디"
                            value={FormData.id}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        <input 
                            type="password"
                            name="pw"
                            placeholder="비밀번호"
                            value={FormData.password}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        <input 
                            type="checkbox" 
                            checked={remember} 
                            onChange={(e) => setRemember(e.target.checked)}
                            className="mt-2 text-xs text-gray-600 cursor-pointer" /> 아이디 기억하기
                        <button className="w-full mt-1 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700">
                            로그인
                        </button>
                        {/* 인라인 요소는 마진이 적용 안 돼서 블럭처리 */}
                        <Link href="/signup" className="mt-2 inline-block text-gray-400 hover:text-indigo-600">회원 가입</Link> 
                </div>
            </form>
        </div>
        </div>
    </AppLayout>
)
}
