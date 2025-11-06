import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import LongdoAddressIframe from "../components/LongdoAddressIframe";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const RegisterParcel = () => {
  const navigate = useNavigate();
  const goToPayment = () => {
    navigate("/admin/Payment");
  };

  const [trackingNumber, setTrackingNumber] = useState("");
  const [sender, setSender] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiver, setReceiver] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [addressData, setAddressData] = useState({});
  const [barcode, setBarcode] = useState("");

  const [weight, setWeight] = useState(0);
  const [serviceType] = useState("EMS");
  const [shippingCost, setShippingCost] = useState(0);

  const [boxes, setBoxes] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [ties, setTies] = useState([]);
  const [bubble_wrap, setBubble_wrap] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [totalEquipment, setTotalEquipment] = useState(0);

  const [totalPrice, setTotalPrice] = useState(0);
  const [netPrice, setNetPrice] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!trackingNumber.trim()) {
        alert("ยังไม่มีเลขพัสดุ");
        return;
      }

      console.log("📦 สแกนพัสดุแล้ว:", trackingNumber);
    }
  };

  // ค่าส่ง
  const handleCalculateShipping = async () => {
    if (!weight || !addressData.postal_code) {
      setMessage("กรุณากรอกน้ำหนักและรหัสไปรษณีย์ก่อนคำนวณค่าส่ง");
      return;
    }

    try {
      const packagingCost = totalEquipment || 0;
      const res = await axios.post(
        "http://localhost:4000/admin-ban-poolsub/calculateEms",
        {
          weight,
          postcode: addressData.postal_code,
          packagingCost,
        },
        {
          auth: {
            username: "admin",
            password: "bands",
          },
        }
      );

      if (res.data.success) {
        setShippingCost(res.data.totalCost);
        recalcPrice();
        setShippingCost({
          total: res.data.totalCost,
          isIsland: res.data.isIsland,
          postcode: res.data.postcode,
        });
      } else {
        setEmsResult(null);
        setMessage("ไม่สามารถคำนวณค่าส่งได้");
      }
    } catch (err) {
      console.error(err);
      setMessage("เกิดข้อผิดพลาดในการคำนวณค่าส่ง");
    }
  };

  // อัปเดตค่า totalEquipment / totalPrice / netPrice อัตโนมัติ
  const recalcPrice = () => {
    const totalEq = equipment.reduce((sum, item) => sum + (item.price || 0), 0);
    setTotalEquipment(totalEq);
    setTotalPrice(totalEq + shippingCost);
    setNetPrice(totalPrice); // ถ้าไม่มีอะไรซับซ้อน
  };

  // อุปกรณ์
  useEffect(() => {
    axios
      .get("http://localhost:4000/admin-ban-poolsub/equipment", {
        auth: {
          username: "admin",
          password: "bands",
        },
      })
      .then((res) => {
        setBoxes(res.data.boxes || []);
        setEnvelopes(res.data.envelopes || []);
        setTies(res.data.ties || []);
        setBubble_wrap(res.data.bubble_wrap || []);
      })
      .catch((err) => console.error("ไม่สามารถโหลดข้อมูลอุปกรณ์:", err));
  }, []);

  if (!equipment) return <p>กำลังโหลดอุปกรณ์...</p>;

  const handleAddItem = (category, item) => {
    setSelectedEquipment((prev) => [...prev, item]);

    const total = [...selectedEquipment, item].reduce(
      (sum, i) => sum + i.price,
      0
    );
    setTotalEquipment(total);
  };

  // ฟังก์ชันลบอุปกรณ์
  const handleRemoveItem = (index) => {
    setSelectedEquipment((prev) => {
      const updated = prev.filter((_, i) => i !== index); // ลบตัวที่กด
      const total = updated.reduce((sum, item) => sum + item.price, 0);
      setTotalEquipment(total); // คำนวณราคารวมใหม่
      return updated;
    });
  };

  const DropdownCategory = ({ categoryName, categoryData, categoryKey }) => (
    <Dropdown className="mb-2">
      <Dropdown.Toggle variant="secondary">{categoryName}</Dropdown.Toggle>
      <Dropdown.Menu>
        {categoryData.map((item, idx) => {
          const names = Array.isArray(item.name) ? item.name : [item.name];
          return names.map((name) => (
            <Dropdown.Item
              key={categoryKey + idx + name}
              onClick={() =>
                handleAddItem(categoryKey, { name, price: item.price })
              }
            >
              {name} ({item.price} บาท)
            </Dropdown.Item>
          ));
        })}
      </Dropdown.Menu>
    </Dropdown>
  );

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

      // คำนวณราคารวมอุปกรณ์
      const totalEquipmentPrice = equipment.reduce(
        (sum, item) => sum + (item.price || 0),
        0
      );

      // คำนวณราคารวมทั้งหมด (รวมค่าส่ง)
      const shippingCostNumber =
        typeof shippingCost === "number"
          ? shippingCost
          : shippingCost.total || 0;
      const totalPriceNumber = totalEquipmentPrice + shippingCostNumber;

      console.log("📦 ข้อมูลที่จะส่ง:", {
        tracking_number: trackingNumber,
        sender,
        sender_phone: senderPhone,
        receiver,
        receiver_phone: receiverPhone,
        address: fullAddress,
        weight,
        equipment: selectedEquipment,
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
          equipment: selectedEquipment,
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
      setSelectedEquipment([]);
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
    <div
      style={{
        width: "500px",
        margin: "0 auto",
        padding: "24px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "24px",
          textAlign: "center",
          color: "#dc2626",
        }}
      >
        ลงทะเบียนพัสดุใหม่
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* เลขพัสดุ */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontWeight: "500",
              marginBottom: "4px",
              textAlign: "left",
            }}
          >
            เลขพัสดุ :
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={handleScan}
            placeholder="แสกนหรือพิมพ์เลขพัสดุ"
            className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
          >
            ยกเลิก
          </button>
        </div>

        {/* ผู้ส่ง */}
        <div
          style={{
            display: "flex", // แนวนอนเฉพาะส่วนนี้
            flexDirection: "row",
            textAlign: "left",
            gap: "16px",
            width: "100%",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label
              style={{
                fontWeight: "500",
                textAlign: "left",
                marginBottom: "4px",
              }}
            >
              ชื่อผู้ส่ง :
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="font-medium mb-1">เบอร์โทรผู้ส่ง :</label>
            <input
              type="text"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        </div>

        {/* ผู้รับ */}
        <div
          style={{
            display: "flex", // แนวนอนเฉพาะส่วนนี้
            flexDirection: "row",
            textAlign: "left",
            gap: "16px",
            width: "100%",
          }}
        >
          <div className="flex-1 flex flex-col">
            <label
              style={{
                fontWeight: "500",
                textAlign: "left",
                marginBottom: "4px",
              }}
            >
              ชื่อผู้รับ :
            </label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label
              style={{
                fontWeight: "500",
                textAlign: "left",
                marginBottom: "4px",
              }}
            >
              เบอร์โทรผู้รับ :
            </label>
            <input
              type="text"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        </div>

        {/* กรอกข้อมูลที่อยู่ */}
        <div>
          <LongdoAddressIframe onChange={setAddressData} />
        </div>

        {/* น้ำหนัก + ค่าส่ง */}
        <div>
          <div className="flex-1 flex flex-col">
            <label
              style={{
                fontWeight: "500",
                textAlign: "left",
                marginBottom: "4px",
              }}
            >
              น้ำหนักพัสดุ (g) :
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
              className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div
            style={{
              display: "flex", // แนวนอนเฉพาะส่วนนี้
              flexDirection: "row",
              textAlign: "left",
              gap: "16px",
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={handleCalculateShipping}
              style={{
                backgroundColor: "#22c55e", // เขียวสด
                color: "black",
                border: "none",
                borderRadius: "20px", // โค้งมากขึ้น
                padding: "6px 12px", // ปุ่มเล็กลง
                fontSize: "14px",
                cursor: "pointer",
                flex: 1, // ทำให้ปุ่มกว้างเต็มพื้นที่ที่มี
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#16a34a")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#22c55e")}
            >
              คำนวณค่าส่ง EMS
            </button>
            {shippingCost && (
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  flex: 1, // ช่องผลลัพธ์กว้างเต็ม
                }}
              >
                {shippingCost.isIsland && <p>พื้นที่เกาะ (+15 บาท)</p>}
                <p>ค่าส่ง EMS: {shippingCost.total} บาท</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔧 เพิ่มอุปกรณ์ */}
<div className="w-full bg-[#FFFDF5] rounded-xl shadow-sm p-5 border border-gray-200">
  <h2 className="text-lg font-semibold text-[#E14434] mb-4">
    🧰 เลือกอุปกรณ์เพิ่มเติม
  </h2>

  {/* ส่วนเลือกอุปกรณ์ */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
      <DropdownCategory
        categoryName="📦 กล่อง"
        categoryData={boxes}
        categoryKey="boxes"
      />
    </div>

    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
      <DropdownCategory
        categoryName="✉️ ซอง"
        categoryData={envelopes}
        categoryKey="envelopes"
      />
    </div>

    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
      <DropdownCategory
        categoryName="🧵 รัดกล่อง"
        categoryData={ties}
        categoryKey="ties"
      />
    </div>

    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
      <DropdownCategory
        categoryName="💨 บับเบิ้ล"
        categoryData={bubble_wrap}
        categoryKey="bubble_wrap"
      />
    </div>
  </div>

  {/* ส่วนแสดงอุปกรณ์ที่เลือก */}
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <h3 className="text-md font-semibold text-gray-800 mb-3">
      🧾 อุปกรณ์ที่เลือก
    </h3>

    {selectedEquipment.length === 0 ? (
      <p className="text-gray-500 italic">ยังไม่ได้เลือกอุปกรณ์</p>
    ) : (
      <ul className="space-y-2">
        {selectedEquipment.map((item, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center bg-[#FFF7DD] px-3 py-2 rounded-md border border-[#E14434]/20"
          >
            <span className="text-gray-800">
              {item.name} ({item.price} บาท)
            </span>
            <button
              className="text-sm text-red-600 hover:text-red-800 font-medium"
              onClick={() => handleRemoveItem(idx)}
            >
              ลบ
            </button>
          </li>
        ))}
      </ul>
    )}

    <div className="border-t border-gray-200 mt-4 pt-3 text-right">
      <p className="font-semibold text-gray-800">
        💰 ราคารวมอุปกรณ์:{" "}
        <span className="text-[#E14434]">{totalEquipment}</span> บาท
      </p>
    </div>
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

      <button
        className="w-full bg-blue-500 text-black p-2 rounded"
        onClick={goToPayment}
      >
        ไปหน้าใบเสร็จชำระเงิน
      </button>
    </div>
  );
};

export default RegisterParcel;
