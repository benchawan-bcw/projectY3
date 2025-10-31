import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AddressDropdown from "../components/AddressDropdown";

const RegisterParcel = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [sender, setSender] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiver, setReceiver] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  const [houseNumber, setHouseNumber] = useState("");
  const [village, setVillage] = useState("");
  const [soi, setSoi] = useState("");
  const [road, setRoad] = useState("");

  const [weight, setWeight] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [serviceType] = useState("EMS");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [addressData, setAddressData] = useState({
    district: "",
    amphoe: "",
    province: "",
    zipcode: "",
  });

  const handleAddressChange = (data) => {
    console.log("ที่อยู่ที่เลือก:", data);
    setAddressData(data);
  };

  const formDivRef = useRef(null);
  const longdoForm = useRef(null);

  // โหลด Longdo Address Form
  useEffect(() => {
    if (window.longdo && formDivRef.current) {
      longdoForm.current = new window.longdo.AddressForm(formDivRef.current, {
        showLabels: true,
        debugDiv: null,
      });

      longdoForm.current.onChange = (data) => {
        setAddressData({
          district: data.district || "",
          amphoe: data.amphoe || "",
          province: data.province || "",
          zipcode: data.zipcode || "",
        });
      };
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!trackingNumber || !sender || !receiver || weight <= 0) {
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setLoading(false);
      return;
    }

    try {
      const fullAddress = `${houseNumber} หมู่ที่${village} ซอย${soi} ถนน${road} ต.${addressData.district} อ.${addressData.amphoe} จ.${addressData.province} ${addressData.zipcode}`;

      const res = await axios.post(
        "http://localhost:4000/admin-ban-poolsub/registerParcel",
        {
          tracking_number: trackingNumber,
          sender,
          sender_phone: senderPhone,
          receiver,
          receiver_phone: receiverPhone,
          address: fullAddress,
          weight,
          total_equipment_price: packagingCost,
          service_type: serviceType,
        },
        {
          auth: {
            username: "admin",
            password: "bands",
          },
        }
      );

      setMessage(res.data.message || "ลงทะเบียนพัสดุสำเร็จ");

      // รีเซ็ตฟอร์ม
      setTrackingNumber("");
      setSender("");
      setSenderPhone("");
      setReceiver("");
      setReceiverPhone("");
      setHouseNumber("");
      setVillage("");
      setSoi("");
      setRoad("");
      setAddressData({ district: "", amphoe: "", province: "", zipcode: "" });
      setWeight(0);
      setPackagingCost(0);

      if (longdoForm.current) longdoForm.current.resetForm();
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
      <h1 className="text-xl font-bold mb-4 text-center">ลงทะเบียนพัสดุใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label>เลขพัสดุ :</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="แสกนหรือพิมพ์เลขพัสดุ"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>ชื่อผู้ส่ง :</label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>เบอร์โทรผู้ส่ง :</label>
          <input
            type="text"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

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
          <label>บ้านเลขที่ :</label>
          <input
            type="text"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label>หมู่ที่ :</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label>ซอย :</label>
            <input
              type="text"
              value={soi}
              onChange={(e) => setSoi(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label>ถนน :</label>
            <input
              type="text"
              value={road}
              onChange={(e) => setRoad(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div>
          <label>กรอกรหัสไปรษณีย์ / เลือกตำบล-อำเภอ-จังหวัด:</label>
          <AddressDropdown onChange={handleAddressChange} />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <strong>ข้อมูลที่เลือก:</strong>
          <pre>{JSON.stringify(addressData, null, 2)}</pre>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label>น้ำหนักพัสดุ (kg) :</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label>ค่าอุปกรณ์ (บาท) :</label>
            <input
              type="number"
              value={packagingCost}
              onChange={(e) => setPackagingCost(Number(e.target.value) || 0)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-black p-2 rounded"
        >
          {loading ? "กำลังลงบันทึก..." : "บันทึกพัสดุ"}
        </button>

        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  );
};

export default RegisterParcel;
