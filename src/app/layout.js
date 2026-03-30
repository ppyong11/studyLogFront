import "./globals.css";

import { AppProvider } from "../providers/AppProvider";
import Header from "../components/Header";
import { Toaster } from "react-hot-toast";
import FloatingTimer from "../components/timer/FloatingTimer";
import AppLayout from "../components/AppLayout";

export default function RootLayout({ children }) {
  
  return (
    <html lang="ko">
      <body>
        {/* 로그인 여부 파악 */}
        <AppProvider>
          {/* 웹소켓 실행 */}
          <AppLayout>
            <div className="min-h-screen bg-gray-100">
              <header className="w-full flex justify-center">
                <div className="w-full md:w-[90%] max-w-[1200px]">
                  <Header />
                </div>
              </header>

              <main className="w-full md:w-[90%] max-w-[1200px] mx-auto bg-white min-h-screen">
                <Toaster position="top-center" reverseOrder={false} />
                {children}
                <FloatingTimer />
              </main>
            </div>
          </AppLayout>
        </AppProvider>
      </body>
    </html>
  );
}