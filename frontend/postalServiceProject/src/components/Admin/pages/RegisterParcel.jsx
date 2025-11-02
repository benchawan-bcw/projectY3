import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import LongdoAddressIframe from "../components/LongdoAddressIframe";

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
  const [equipment, setEquipment] = useState([]); // array of { name, price }
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [serviceType] = useState("EMS");
  const [shippingCost, setShippingCost] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [netPrice, setNetPrice] = useState(0);

  const [addressData, setAddressData] = useState({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // อัปเดตค่า totalEquipment / totalPrice / netPrice อัตโนมัติ
  const recalcPrice = () => {
    const totalEq = equipment.reduce((sum, item) => sum + (item.price || 0), 0);
    setTotalEquipment(totalEq);
    setTotalPrice(totalEq + shippingCost);
    setNetPrice(totalPrice); // ถ้าไม่มีอะไรซับซ้อน
  };

  const handleAddEquipment = (name, price) => {
    setEquipment((prev) => [...prev, { name, price }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (
      !trackingNumber ||
      !sender ||
      !receiver ||
      weight <= 0 ||
      !addressData.district
    ) {
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const fullAddress = [
        addressData.etc,
        addressData.subdistrict
          ? "ต." + addressData.subdistrict.replace(/^ต\./, "")
          : "",
        addressData.district
          ? "อ." + addressData.district.replace(/^อ\./, "")
          : "",
        addressData.province
          ? "จ." + addressData.province.replace(/^จ\./, "")
          : "",
        addressData.postal_code || "",
      ]
        .map((item) => item.trim()) // ลบ whitespace รอบ ๆ
        .filter((item) => item) // ลบค่าว่าง
        .join(" "); // ต่อด้วย space แทน \n

      console.log("📦 ข้อมูลที่จะส่ง:", {
        tracking_number: trackingNumber,
        sender,
        sender_phone: senderPhone,
        receiver,
        receiver_phone: receiverPhone,
        address: fullAddress,
        weight,
        equipment,
        total_equipment: totalEquipment,
        service_type: serviceType,
        shipping_cost: shippingCost,
        total_price: totalPrice,
        net_price: netPrice,
      });

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
          equipment,
          total_equipment: totalEquipment,
          service_type: serviceType,
          shipping_cost: shippingCost,
          total_price: totalPrice,
          net_price: netPrice,
        },
        {
          auth: {
            username: "admin",
            password: "bands",
          },
        }
      );

      setMessage(res.data.message || "ลงทะเบียนพัสดุสำเร็จ");

      // reset form
      setTrackingNumber("");
      setSender("");
      setSenderPhone("");
      setReceiver("");
      setReceiverPhone("");
      setWeight(0);
      setEquipment([]);
      setTotalEquipment(0);
      setShippingCost(0);
      setTotalPrice(0);
      setNetPrice(0);
      setAddressData({});
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
    <div className="w-full px-8">
      <h1 className="text-xl font-bold mb-4 text-center">ลงทะเบียนพัสดุใหม่</h1>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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

        <div className="flex gap-4 w-full">
          <div className="flex-1 min-w-0 flex flex-col">
            <label>ชื่อผู้ส่ง :</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <label>เบอร์โทรผู้ส่ง :</label>
            <input
              type="text"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <div className="flex-1 flex flex-col">
            <label>ชื่อผู้รับ :</label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label>เบอร์โทรผู้รับ :</label>
            <input
              type="text"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div>
          <LongdoAddressIframe onChange={setAddressData} />
        </div>

        <div className="flex gap-4 w-full">
          <div className="flex-1 flex flex-col">
            <label>น้ำหนักพัสดุ (g) :</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label>ค่าส่ง :</label>
            <input
              type="number"
              placeholder="ค่าส่ง (บาท)"
              value={shippingCost}
              onChange={(e) => {
                setShippingCost(Number(e.target.value));
                recalcPrice();
              }}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <div className="flex-1 flex flex-col">
            <label className="font-semibold">อุปกรณ์ (เพิ่มได้หลายชิ้น):</label>
            <button
              type="button"
              onClick={() => handleAddEquipment("กล่อง", 20)}
            >
              เพิ่มกล่อง 20 บาท
            </button>
            <button type="button" onClick={() => handleAddEquipment("เทป", 5)}>
              เพิ่มเทป 5 บาท
            </button>
            <pre>{JSON.stringify(equipment, null, 2)}</pre>
          </div>

          <div className="flex-1 flex flex-col">
            <p>ค่าอุปกรณ์: {totalEquipment} บาท</p>
            <p>รวมค่าส่ง + อุปกรณ์: {totalPrice} บาท</p>
            <p>ราคาสุทธิ: {netPrice} บาท</p>
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
