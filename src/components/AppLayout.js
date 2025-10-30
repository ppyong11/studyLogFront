import Header from "./Header";

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100 ">
            <header className="w-full flex justify-center">
                <div className="w-full md:w-[90%] max-w-[1200px]">
                    <Header />
                </div>
            </header>
            
            <main className="w-full md:w-[90%] max-w-[1200px] mx-auto bg-white min-h-screen">
                {children}
            </main>
        </div>
    );
}