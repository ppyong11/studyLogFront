'use client'

import { useState, useEffect } from 'react';
import Header from "../components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center h-screen bg-white">
        <h1 className="text-4xl font-bold">Study Log 메인 페이지</h1>
        <p className="mt-4 text-gray-600">여기에 네가 만든 메인 컴포넌트 넣으면 돼</p>
      </main>
      <footer className="w-full text-center py-4 text-sm text-gray-500 border-t">
      <p>아이콘 저작권: <a href="https://icons8.kr" className="underline" target="_blank">icons8.kr</a></p>
      </footer>
    </>
);
}