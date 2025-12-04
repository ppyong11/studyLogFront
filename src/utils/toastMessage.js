import toast from "react-hot-toast";

export function showToast(message) {
    toast.custom(() => (
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
            }}
        >
            {message}
        </div>
    ))
}