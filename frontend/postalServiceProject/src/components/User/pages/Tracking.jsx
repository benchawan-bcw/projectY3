import React, { useState } from "react";

function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันเรียก API ของไปรษณีย์ไทย
  // const getTrackingStatus = async (trackingNumber) => {
  //   try {
  //     const apiKey = "YOUR_API_KEY"; // 🔐 ใส่ API Key ที่ได้จาก https://track.thailandpost.co.th/developer

  //     // 1️⃣ ขอ Token ยืนยันตัวตน
  //     const tokenRes = await fetch(
  //       "https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: "Token " + apiKey,
  //         },
  //       }
  //     );
  //     const { token } = await tokenRes.json();

  //     // 2️⃣ ใช้ Token ไปดึงข้อมูล Tracking
  //     const trackRes = await fetch(
  //       "https://trackapi.thailandpost.co.th/post/api/v1/track",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: "Token " + token,
  //         },
  //         body: JSON.stringify({
  //           status: "all",
  //           language: "TH",
  //           barcode: [trackingNumber],
  //         }),
  //       }
  //     );

  //     const data = await trackRes.json();
  //     return data.response.items[trackingNumber];
  //   } catch (err) {
  //     console.error("เกิดข้อผิดพลาด:", err);
  //     return null;
  //   }
  // };

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
