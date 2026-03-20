/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포(Production) 환경에서 console.log 지우기
    compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error"], // console.error는 에러 추적을 위해 남겨둠
    } : false,
    },
};

export default nextConfig;
