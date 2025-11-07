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
      setTimeout(() => setIsScanned(false), 1000);

      console.log("📦 สแกนพัสดุแล้ว:", trackingNumber);
    }
  };

  const handleReset = () => {
    setTrackingNumber(""); // ล้างเลขพัสดุ
  };

  // ค่าส่ง
  const handleCalculateShipping = async () => {
    if (!weight || !addressData.postal_code) {
      alert("กรุณากรอกน้ำหนักและรหัสไปรษณีย์ก่อนคำนวณค่าส่ง");
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
        alert("ไม่สามารถคำนวณค่าส่งได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการคำนวณค่าส่ง");
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

  const DropdownCategory = ({
    categoryName,
    categoryData,
    categoryKey,
    textColor = "#1A2A4F",
    size = "base",
  }) => (
    <Dropdown className="mb-2">
      <Dropdown.Toggle
        style={{
          background: "#FEFBC7",
          color: textColor,
          width: "100%",
          fontWeight: "600",
          fontSize:
            size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem",
          borderRadius: "12px",
          padding: "10px 14px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
        }}
        className="hover:scale-105"
      >
        {categoryName}
      </Dropdown.Toggle>
      <Dropdown.Menu
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E14434",
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          padding: "6px 0",
        }}
      >
        {categoryData.map((item, idx) => {
          const names = Array.isArray(item.name) ? item.name : [item.name];
          return names.map((name) => (
            <Dropdown.Item
              key={categoryKey + idx + name}
              onClick={() =>
                handleAddItem(categoryKey, { name, price: item.price })
              }
              style={{
                color: textColor,
                fontSize:
                  size === "sm"
                    ? "0.875rem"
                    : size === "lg"
                    ? "1.125rem"
                    : "1rem",
                padding: "10px 16px",
                transition: "all 0.2s ease",
              }}
              className="hover:bg-[#FEFBC7] hover:text-[#E14434]"
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
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
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
      setLoading(false);

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
      alert("เกิดข้อผิดพลาดในการลงทะเบียนพัสดุ"); // 👈 เด้ง popup แจ้งข้อผิดพลาด
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
            readOnly
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={handleScan}
            placeholder="แสกนหรือพิมพ์เลขพัสดุ"
            className="w-full border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            onClick={handleReset}
            style={{
              marginTop: "1rem",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              cursor: "pointer",
              width: "30%",
            }}
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
        <div className="mb-3">
          {/* ช่องกรอกน้ำหนัก */}
          <div className="mb-3">
            <label
              className="form-label fw-medium text-start d-block"
              style={{ marginBottom: "4px" }}
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

          {/* ปุ่มคำนวณ + กล่องผลลัพธ์ */}
          <div className="row g-2 align-items-center mt-2">
            <div className="col-6">
              <button
                type="button"
                onClick={handleCalculateShipping}
                className="w-100 py-2"
                style={{
                  backgroundColor: "#4A70A9",
                  color: "EFECE3", // override ให้ตัวหนังสือเป็นดำ
                  borderRadius: "8px",
                  fontSize: "14px",
                  height: "50px",
                  transition: "0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#8FABD4")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#4A70A9")}
              >
                คำนวณค่าส่ง EMS
              </button>
            </div>

            <div className="col-6">
              <div
                className="d-flex flex-column justify-content-center text-center border rounded bg-light"
                style={{
                  height: "50px",
                  fontSize: "14px",
                  borderColor: "#d1d5db",
                }}
              >
                {shippingCost?.isIsland && (
                  <p className="m-0">พื้นที่เกาะ (+15 บาท)</p>
                )}
                <p className="m-0">
                  ค่าส่ง EMS: {shippingCost?.total ?? 0} บาท
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔧 เพิ่มอุปกรณ์ */}
        <div className="w-full bg-[#fff] rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-[#E14434] mb-6 flex items-center gap-2">
            <i className="bi bi-tools"></i>
            เลือกอุปกรณ์เพิ่มเติม
          </h2>

          {/* ส่วนเลือกอุปกรณ์ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-ts-transparent rounded-xl p-5  hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <DropdownCategory
                categoryName={
                  <span className="flex items-center gap-2">
                    <i className="bi bi-box-seam text-[#E14434]"></i> กล่อง
                  </span>
                }
                categoryData={boxes}
                categoryKey="boxes"
                size="lg"
              />
            </div>

            <div className="bg-transparent rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <DropdownCategory
                categoryName={
                  <span className="flex items-center gap-2">
                    <i className="bi bi-envelope-paper text-[#E14434]"></i> ซอง
                  </span>
                }
                categoryData={envelopes}
                categoryKey="envelopes"
                size="lg"
              />
            </div>

            <div className="bg-transparent rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <DropdownCategory
                categoryName={
                  <span className="flex items-center gap-2">
                    <i className="bi bi-link-45deg text-[#E14434]"></i> รัดกล่อง
                  </span>
                }
                categoryData={ties}
                categoryKey="ties"
                size="lg"
              />
            </div>

            <div className="bg-transparent rounded-xl p-5  hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <DropdownCategory
                categoryName={
                  <span className="flex items-center gap-2">
                    <i className="bi bi-bag-dash text-[#E14434]"></i> บับเบิ้ล
                  </span>
                }
                categoryData={bubble_wrap}
                categoryKey="bubble_wrap"
                size="lg"
              />
            </div>
          </div>

          {/* ส่วนแสดงอุปกรณ์ที่เลือก */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mt-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="bi bi-receipt-cutoff text-[#E14434]"></i>
              อุปกรณ์ที่เลือก
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
                <i className="bi bi-cash-stack text-[#E14434]"></i>
                ราคารวมอุปกรณ์:{" "}
                <span className="text-[#E14434]">{totalEquipment}</span> บาท
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-lg w-100 mb-2"
          style={{
            backgroundColor: "#5EABD6",
            color: "#16476A", // override สีข้อความ (Bootstrap ใช้สีขาวเริ่มต้น)
            borderRadius: "10px",
            fontSize: "18px",
            height: "50px",
            width: "70%",
          }}
        >
          {loading ? "กำลังลงบันทึก..." : "บันทึกพัสดุ"}
        </button>

        {message && <p className="mt-3 text-center">{message}</p>}
      </form>

      <button
        type="button"
        onClick={goToPayment}
        className="btn-lg w-100 mb-2"
        style={{
          backgroundColor: "#E62727",
          color: "#DCDCDC", // override สีข้อความ (Bootstrap ใช้สีขาวเริ่มต้น)
          borderRadius: "10px",
          fontSize: "18px",
          height: "50px",
          width: "0%",
        }}
      >
        ใบเสร็จชำระเงิน
      </button>
    </div>
  );
};

export default RegisterParcel;
