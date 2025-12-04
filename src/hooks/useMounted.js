import {useState, useEffect } from 'react';

export function useMounted() {
    // 브라우저가 마운트 될때까지 UI 렌더링 보류
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}