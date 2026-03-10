import toast from "react-hot-toast";

export function showToast(message, type= "default") {
    toast.custom(
    (t) => (
        <div
            style={{
                padding: "14px 20px",
                color: "black",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                wordBreak: "keep-all",
                lineHeight: "1.4",
                transition: "all 0.3s ease", // 부드럽게 사라짐
                opacity: t.visible ? 1 : 0, 
                transform: t.visible ? "translateY(0px)" : "translateY(-10px)",
                border: type === "error" ? "2px solid #ff4d4f" : "2px solid #ffffffff", 
            }}
        >
        {message}
        </div>
    ),
    { duration: 1000 } // 1초 후 사라짐
    );
}
