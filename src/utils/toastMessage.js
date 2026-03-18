import toast from "react-hot-toast";

export function showToast(message, type= "default") {
    const borderColors = {
        error: "2px solid #ff4d4f", // 빨간색 (에러)
        info: "2px solid #3b82f6",  // 파란색 (알림/정보)
        default: "2px solid #ffffffff", // 흰색 (기본)
    };

    // 전달받은 type이 객체에 없으면 default 색상 사용 (이상한 값 들어오면 default 처리)
    const borderColor = borderColors[type] || borderColors.default;

    toast.custom(
    (t) => (
        <div
            style={{
                padding: "14px 20px",
                backgroundColor: "white",
                color: "black",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                wordBreak: "keep-all",
                lineHeight: "1.4",
                transition: "all 0.3s ease", // 부드럽게 사라짐
                opacity: t.visible ? 1 : 0, 
                transform: t.visible ? "translateY(0px)" : "translateY(-10px)",
                border: borderColor
            }}
        >
        {message}
        </div>
    ),
    { duration: 1500 } // 1.5초 후 사라짐
    );
}
