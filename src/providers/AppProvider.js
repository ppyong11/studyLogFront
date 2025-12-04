"use client";

import { authStore } from "../store/authStore";
import { useEffect } from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function AppProvider({ children }) {
    const setUser = authStore((s) => s.setUser);
    const clearUser = authStore((s) => s.clearUser);

    useEffect(() => {
    axios.get(`${apiUrl}/member`, { withCredentials: true })
        .then(res => setUser(res.data.user))
        .catch(() => clearUser());
    }, []);

    return children;
}
