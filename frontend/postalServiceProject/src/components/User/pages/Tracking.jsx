import React, { useState } from "react";

function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันกดปุ่ม "ตรวจสอบ"
  const handleTrack = async () => {
    // น่าจะไม่ต้องเช็คว่าใส่เลขพัสดุหรือยัง
    if (!trackingNumber) return alert("กรุณากรอกเลขพัสดุ");
    setLoading(true);
    const res = await fetch(
      `http://localhost:4000/customer-ban-poolsub/track/${trackingNumber}`
    );
    const data = await res.json();
    // const data = await getTrackingStatus(trackingNumber);
    setResult(data);
    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Prompt, sans-serif",
      }}
    >
      {/* 🔹 หัวข้อ */}
      <h2
        style={{
          fontSize: "26px",
          fontWeight: "700",
          marginBottom: "24px",
          textAlign: "center",
          color: "#d71a28",
        }}
      >
        📦 ตรวจสอบสถานะพัสดุ (Thailand Post)
      </h2>

      {/* 🔹 กล่องกรอกข้อมูล */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="กรอกเลขพัสดุ เช่น EX123456789TH"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          style={{
            padding: "10px 14px",
            width: "320px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            outline: "none",
            transition: "0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#d71a28")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />

        <button
          onClick={handleTrack}
          style={{
            padding: "10px 18px",
            backgroundColor: "#d71a28",
            color: "white",
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#b81823")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#d71a28")}
        >
          🔍 ตรวจสอบ
        </button>
      </div>

      {/* 🔹 กำลังโหลด */}
      {loading && (
        <p
          style={{ textAlign: "center", color: "#6b7280", fontStyle: "italic" }}
        >
          ⏳ กำลังตรวจสอบสถานะพัสดุ...
        </p>
      )}

      {/* 🔹 แสดงผลลัพธ์ */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          marginTop: "20px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        {result && Array.isArray(result) && result.length > 0 ? (
          <>
            <h3
              style={{
                textAlign: "center",
                marginBottom: "16px",
                color: "#111827",
                fontWeight: "600",
              }}
            >
              📨 สถานะล่าสุดของพัสดุ
            </h3>
            {result
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.status_date).getTime() -
                  new Date(a.status_date).getTime()
              )
              .map((item, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderLeft: "5px solid #d71a28",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "10px",
                    transition: "0.2s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fef2f2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                >
                  <p style={{ margin: 0, fontWeight: "600", color: "#111827" }}>
                    ✅ {item.status_description}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    🕒 {item.status_date.split("+")[0]} — 📍 {item.location}
                  </p>
                </div>
              ))}
          </>
        ) : (
          !loading && (
            <p style={{ textAlign: "center", color: "#9ca3af" }}>
              🔎 กรุณากรอกเลขพัสดุเพื่อเริ่มตรวจสอบ
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default Tracking;
