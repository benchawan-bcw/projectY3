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
    <div className="w-full max-w-2xl mx-auto p-4 border rounded shadow">
      <h1 className="text-xl font-bold mb-4 text-cente">ลงทะเบียนพัสดุใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label>Tracking Number :</label>
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

        <hr className="my-4 border-t-2 border-gray-300" />

        <div>
          <label>ชื่อผู้ส่ง :</label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* แก้ */}
        <div>
          <label>เบอร์โทรศัพท์ :</label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <hr className="my-4 border-t-2 border-gray-300" />

        <div>
          <label>ชื่อผู้รับ :</label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>บ้านเลขที่ : </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* หมู่ที่, ซอย, ถนน */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label>หมู่ที่ :</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label>ซอย :</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label>ถนน :</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div>
          <label>แขวง/ตำบล : </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>เขต/อำเภอ : </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>จังหวัด :</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* แก้ */}
        <div>
          <label>รหัสไปรษณีย์ :</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* แก้ */}
        <div>
          <label>เบอร์โทรศัพท์ :</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded"
          />
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
