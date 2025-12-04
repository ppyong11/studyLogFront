"use client";

import { create } from "zustand";

export const authStore = create((set) => ({
    user: null,
    isChecking: true,

    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),

    setChecking: (v) => set({ isChecking: v }),
}));