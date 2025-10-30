import React, { useState, useRef } from "react";
import axios from "axios";

const Receipt = () => {
  const [receiverName, setReceiverName] = useState("");
  const [parcel, setParcel] = useState(null);
  const [paperSize, setPaperSize] = useState("80mm"); // 58mm หรือ 80mm
  const receiptRef = useRef();

  const fetchParcel = async () => {
    if (!receiverName) return;
    try {
      const res = await axios.get(
        "http://localhost:4000/admin-ban-poolsub/getParcels",
        {
          auth: {
            username: "admin",
            password: "bands",
          },
        }
      );

      // กรองตามชื่อผู้รับ
      const filtered = res.data.find((p) =>
        p.receiver.toLowerCase().includes(receiverName.toLowerCase())
      );

      if (!filtered) {
        alert("ไม่พบพัสดุของผู้รับนี้");
        setParcel(null);
      } else {
        setParcel(filtered);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setParcel(null);
    }
  };

  const handlePrint = () => {
    if (!parcel) return;

    // เปิดหน้าต่างใหม่สำหรับปริ้น
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>ใบเสร็จ</title>
          <style>
            @media print {
              body {
                width: ${paperSize};
                font-family: sans-serif;
                margin: 0;
                padding: 5mm;
              }
              .receipt {
                width: 100%;
              }
            }
            body {
              font-family: sans-serif;
              padding: 5mm;
            }
            .receipt {
              border: 1px solid #000;
              padding: 5px;
              width: ${paperSize};
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <p><b>หมายเลขพัสดุ:</b> ${parcel.tracking_number}</p>
            <p><b>ผู้ส่ง:</b> ${parcel.sender}</p>
            <p><b>ผู้รับ:</b> ${parcel.receiver}</p>
            <p><b>ที่อยู่:</b> ${parcel.address}</p>
            <p><b>น้ำหนัก:</b> ${parcel.weight} กก.</p>
            <p><b>บริการ:</b> ${parcel.service_type}</p>
            ${
              parcel.price ? `<p><b>ค่าบริการ:</b> ${parcel.price} บาท</p>` : ""
            }
            <p><b>สถานะ:</b> ${parcel.status}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print(); // เรียกเครื่องพิมพ์
  };

  return (
    <div style={{ margin: "20px" }}>
      <h1>ใบเสร็จ</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>กรอกชื่อผู้รับ: </label>
        <input
          type="text"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button onClick={fetchParcel}>ค้นหา</button>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>เลือกขนาดกระดาษ: </label>
        <select
          value={paperSize}
          onChange={(e) => setPaperSize(e.target.value)}
        >
          <option value="58mm">🧾 58 mm</option>
          <option value="80mm">🧾 80 mm</option>
        </select>
      </div>

      {parcel && (
        <div
          ref={receiptRef}
          className="receipt"
          style={{ border: "1px solid #000", padding: "10px" }}
        >
          <p>
            <b>หมายเลขพัสดุ:</b> {parcel.tracking_number}
          </p>
          <p>
            <b>ผู้ส่ง:</b> {parcel.sender}
          </p>
          <p>
            <b>ผู้รับ:</b> {parcel.receiver}
          </p>
          <p>
            <b>ที่อยู่:</b> {parcel.address}
          </p>
          <p>
            <b>น้ำหนัก:</b> {parcel.weight} กก.
          </p>
          <p>
            <b>บริการ:</b> {parcel.service_type}
          </p>
          {parcel.price && (
            <p>
              <b>ค่าบริการ:</b> {parcel.price} บาท
            </p>
          )}
          <p>
            <b>สถานะ:</b> {parcel.status}
          </p>
        </div>
      )}

      <button onClick={handlePrint} style={{ marginTop: "10px" }}>
        🖨 พิมพ์ใบเสร็จ
      </button>
    </div>
  );
};

export default Receipt;
