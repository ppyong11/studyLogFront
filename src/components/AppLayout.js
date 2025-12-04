"use client";

import Header from "./Header";
import { useState, useEffect } from "react";
import { authStore } from "../store/authStore";
import { Toaster } from "react-hot-toast";

import axios from 'axios';

const apiUrl= process.env.NEXT_PUBLIC_API_URL;

export default function AppLayout({ children }) {
    const user = authStore((state) => state.user); // 값
    const setUser = authStore((state) => state.setUser); // 함수
    const clearUser = authStore((state) => state.clearUser); // 함수 
    const setChecking = authStore((state) => state.setChecking);

    useEffect(() => {
        const fetchUser = async () => {
        try {
            const res = await axios.get(`${apiUrl}/member`, { withCredentials: true });
            setUser(res.data.user);
        } catch {
            clearUser();
        } finally {
            setChecking(false);     // ✅ 로딩 종료 시점 명확히
        }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        console.log("✅ user changed:", user);
    }, [user]);


    return (
        
        <div className="min-h-screen bg-gray-100 ">
            <header className="w-full flex justify-center">
                <div className="w-full md:w-[90%] max-w-[1200px]">
                    <Header />
                </div>
            </header>
            
            <main className="w-full md:w-[90%] max-w-[1200px] mx-auto bg-white min-h-screen">
                <Toaster position= "top-center" reversOrder={false} />
                {children}
            </main>
        </div>
    );
}