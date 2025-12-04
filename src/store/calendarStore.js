// store/calendarStore.js
import { create } from "zustand";
import dayjs from "dayjs";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const calendarStore = create((set, get) => ({
  // 현재 뷰: "grid", "weekly", "monthly"
    currentView: "grid",

    // 선택된 날짜 (뷰 기준)
    selectedDate: dayjs(),

    // 필터 옵션
    filters: {
        category: "",
        keyword: "",
        statusStr: "",
        sort: "",
        page: 0,
    },

    // 조회된 계획 데이터
    plans: [],

    // 선택 날짜 업데이트
    setSelectedDate: (date) => set({ selectedDate: dayjs(date) }),

    // 뷰 변경
    setCurrentView: (view) => set({ currentView: view }),

    // 필터 변경
    setFilters: (filters) => set({ filters }),

    // 계획 조회
    fetchPlans: async () => {
        const { currentView, selectedDate, filters } = get();

        try {
        let startDate = selectedDate;
        let endDate;

        if (currentView === "grid") {
            endDate = selectedDate;
        } else if (currentView === "weekly") {
            startDate = selectedDate.startOf("week"); // locale 맞춰서 필요하면 plugin 사용
            endDate = selectedDate.endOf("week");
        } else if (currentView === "monthly") {
            startDate = selectedDate.startOf("month");
            endDate = selectedDate.endOf("month");
        }

        let params;
        let res;
        if (currentView === "grid") {
            params = {
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD"),
            ...filters,
            };
            res = await axios.get(`${apiUrl}/plans/search`, {
            params,
            withCredentials: true,
            });
        } else {
            params = {
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD"),
            range: currentView,
            };
            res = await axios.get(`${apiUrl}/plans/calendar`, {
            params,
            withCredentials: true,
            });
        }

        set({ plans: res.data });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "서버 연결 실패");
        }
    }

}));
