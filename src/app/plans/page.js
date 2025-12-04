'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "../../hooks/useUser"; 
import axios from 'axios';
import { showToast } from "../../utils/toastMessage";
import { calendarStore } from "../../store/calendarStore"; 
import dayjs from "dayjs";

const apiUrl= process.env.NEXT_PUBLIC_API_URL;

export default function Mypage(){
    const route = useRouter();
    const user = useUser();

    const { selectedDate, currentView, filters, plans, setSelectedDate, setCurrentView, setFilters, fetchPlans } = calendarStore();

    // 폼으로부터 string으로 받고 요청 보내기 전에 변환 거치기
    const [formData, setFormData] = useState({
        name:'',
        memo:'',
        categoryId:'',
        startDate:'',
        endDate:'',
        minutes:'',
    });

    const payload = {
        name: formData.name,
        memo: formData.memo,
        categoryId: parseInt(formData.categoryId), // 9조 안팎이라 parseInt 가능
        startDate: formData.startDate, // "2025-01-01" 포맷으로 받기
        endDate: formData.endDate,
        minutes: parseInt(formData.minutes)
    };

    // 입력 값 변경 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    // 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post(`${apiUrl}/plans`, payload, {
                withCredentials: true, // 서버는 쿠키 받아서 인증 객체 생성
            });

            showToast("계획을 등록했습니다.");

            // 추가한 계획 포함 재조회
            fetchPlans();
        } catch(error){
            if (error.response) {
                alert(error.response.data.message);
            } else {
                alert(`서버에 연결되지 않습니다.`);
            }
        }
    };

    // 초기 조회
    useEffect(() => {
        fetchPlans();
    }, [currentView, selectedDate, filters]);

    // 날짜 이동 (화살표)
    const handleArrowMove = (direction) => {
        let newDate = selectedDate;
        if (currentView === "weekly") newDate = selectedDate.add(direction === "next" ? 1 : -1, "week");
        if (currentView === "monthly") newDate = selectedDate.add(direction === "next" ? 1 : -1, "month");
        setSelectedDate(newDate);
        fetchPlans();
    };


    return (
    <div>
        <h1>Plan Page</h1>

        {/* 뷰 선택 */}
        <select value={currentView} onChange={(e) => setCurrentView(e.target.value)}>
        <option value="day">Day</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        </select>

        {/* 화살표 이동 (weekly/monthly) */}
        {(currentView === "weekly" || currentView === "monthly") && (
        <>
            <button onClick={() => handleArrowMove("prev")}>◀</button>
            <span>{selectedDate.format("YYYY-MM-DD")}</span>
            <button onClick={() => handleArrowMove("next")}>▶</button>
        </>
        )}

        {/* 계획 추가 폼 */}
        <form onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="이름"/>
        <input name="memo" value={formData.memo} onChange={handleChange} placeholder="메모"/>
        <input name="categoryId" value={formData.categoryId} onChange={handleChange} placeholder="카테고리ID"/>
        <input name="startDate" value={formData.startDate} onChange={handleChange} placeholder="시작일 YYYY-MM-DD"/>
        <input name="endDate" value={formData.endDate} onChange={handleChange} placeholder="종료일 YYYY-MM-DD"/>
        <input name="minutes" value={formData.minutes} onChange={handleChange} placeholder="분"/>
        <button type="submit">등록</button>
        </form>

        {/* 계획 표시 */}
        <ul>
        {plans.map(plan => (
            <li key={plan.id}>{plan.name} ({plan.startDate} ~ {plan.endDate})</li>
        ))}
        </ul>
    </div>
    );
}