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
    <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h2>📦 ตรวจสอบสถานะพัสดุ (Thailand Post)</h2>

      <input
        type="text"
        placeholder="กรอกเลขพัสดุ เช่น EX123456789TH"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
          marginRight: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      />

      <button
        onClick={handleTrack}
        style={{
          padding: "10px 15px",
          backgroundColor: "#d71a28",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        ตรวจสอบ
      </button>

      {loading && <p>⏳ กำลังตรวจสอบ...</p>}

      {result && Array.isArray(result) && result.length > 0 ? (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          {result
            .slice()
            .sort((a, b) => new Date(b.status_date) - new Date(a.status_date))
            .map((item, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                ✅ {item.status_date.split("+")[0]} — {item.status_description}{" "}
                @ {item.location}
              </div>
            ))}
        </div>
      ) : (
        <p>ไม่มีสถานะพัสดุ</p>
      )}
    </div>
  );
}

export default Tracking;
