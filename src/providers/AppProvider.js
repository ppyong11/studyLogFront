"use client";

import { authStore } from "../store/authStore";
import { useEffect } from "react";

export function AppProvider({ children }) {
    const checkAuth = authStore((s) => s.checkAuth);

    useEffect(() => {
        checkAuth();
    }, []);


    return children;
}
