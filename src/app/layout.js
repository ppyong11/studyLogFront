import "./globals.css";

import { AppProvider } from "../providers/AppProvider";
import Header from "../components/Header";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AppProvider>
          <div className="min-h-screen bg-gray-100">
            <header className="w-full flex justify-center">
              <div className="w-full md:w-[90%] max-w-[1200px]">
                <Header />
              </div>
            </header>

            <main className="w-full md:w-[90%] max-w-[1200px] mx-auto bg-white min-h-screen">
              <Toaster position="top-center" reverseOrder={false} />
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
