// สแกนบาร์โค้ดแล้วบันทึกเข้าสู่ระบบ
import React, { useEffect, useState } from "react";
import axios from "axios";
// import { set } from "mongoose";

const RegisterParcel = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [address, setAddress] = useState("");
  const [weight, setWeight] = useState(0);
  const [serviceType] = useState("EMS");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      alert("Scanned: " + trackingNumber);
      setTrackingNumber(""); // reset input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!trackingNumber || !sender || !receiver || !address || weight <= 0) {
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:4000/admin-ban-poolsub/registerParcel",
        {
          tracking_number: trackingNumber,
          sender,
          receiver,
          address,
          weight,
          service_type: serviceType,
        },
        {
          auth: {
            username: "admin",
            password: "bands",
          },
        }
      );

      setMessage(res.data.message);
      // รีเซ็ตฟอร์ม
      setTrackingNumber("");
      setSender("");
      setReceiver("");
      setAddress("");
      setWeight(0);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียนพัสดุ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">ลงทะเบียนพัสดุใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label>Tracking Number:</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            placeholder="แสกนหรือพิมพ์เลขพัสดุ"
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>ผู้ส่ง:</label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>ผู้รับ:</label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>ที่อยู่:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="บ้านเลขที่, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>น้ำหนัก(กรัม):</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>ประเภทบริการ:</label>
          <label className="w-full border p-2 rounded">EMS</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-black p-2 rounded"
        >
          {loading ? "กำลังลงบันทึก..." : "บันทึกพัสดุ"}
        </button>
      </form>
      {message && <p className="mt-3 text-center">{message}</p>}
    </div>
  );
};

export default RegisterParcel;
