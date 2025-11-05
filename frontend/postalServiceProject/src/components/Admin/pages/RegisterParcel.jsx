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

      // ตัวอย่าง: ไปดึงข้อมูลจากฐานข้อมูล หรือเตรียมข้อมูลพัสดุใหม่
      // หรือจะบันทึกเลขพัสดุชั่วคราวก็ได้
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

  // อุปกร
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
    <div className="w-full px-8">
      <h1 className="text-xl font-bold mb-4 text-center">ลงทะเบียนพัสดุใหม่</h1>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div>
          <label>เลขพัสดุ :</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={handleScan}
            placeholder="แสกนหรือพิมพ์เลขพัสดุ"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* ผู้ส่ง */}
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

        {/* ผู้รับ */}
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

        {/* กรอกข้อมูลที่อยู่ */}
        <div>
          <LongdoAddressIframe onChange={setAddressData} />
        </div>

        {/* น้ำหนัก + ค่าส่ง */}
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
          <button
            type="button"
            onClick={handleCalculateShipping}
            className="mt-2 bg-green-500 text-black rounded p-1"
          >
            คำนวณค่าส่ง EMS
          </button>
          {shippingCost && (
            <div className="mt-2 bg-gray-100 p-2 rounded border text-sm">
              {shippingCost.isIsland && <p>พื้นที่เกาะ (+15 บาท)</p>}
              <p>ค่าส่ง EMS: {shippingCost.total} บาท</p>
            </div>
          )}
        </div>

        {/* เพิ่มอุปกร  */}
        <div className="flex gap-4 w-full">
          <h2>เลือกอุปกรณ์</h2>

          <DropdownCategory
            categoryName="กล่อง"
            categoryData={boxes}
            categoryKey="boxes"
          />
          <DropdownCategory
            categoryName="ซอง"
            categoryData={envelopes}
            categoryKey="envelopes"
          />
          <DropdownCategory
            categoryName="รัดกล่อง"
            categoryData={ties}
            categoryKey="ties"
          />
          <DropdownCategory
            categoryName="บับเบิ้ล"
            categoryData={bubble_wrap}
            categoryKey="bubble_wrap"
          />

          <div className="border p-3 rounded mt-3">
            <h3>อุปกรณ์ที่เลือก:</h3>
            {selectedEquipment.length === 0 ? (
              <p>ยังไม่ได้เลือกอุปกรณ์</p>
            ) : (
              <ul>
                {selectedEquipment.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    {item.name} ({item.price} บาท)
                    <button
                      className="ml-2 text-red-500"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      ลบ
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p>ราคารวมอุปกรณ์: {totalEquipment} บาท</p>
          </div>

          {/* <div className="flex-1 flex flex-col">
            <p>ค่าอุปกรณ์: {totalEquipment} บาท</p>
            <p>รวมค่าส่ง + อุปกรณ์: {totalPrice} บาท</p>
            <p>ราคาสุทธิ: {netPrice} บาท</p>
          </div> */}
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
