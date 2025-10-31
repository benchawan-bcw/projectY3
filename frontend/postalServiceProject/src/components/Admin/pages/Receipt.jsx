import React, { useState, useRef } from "react";
import axios from "axios";

const Receipt = () => {
  const [receiverName, setReceiverName] = useState("");
  const [parcel, setParcel] = useState(null);
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
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <html>
      <head>
        <title>ใบเสร็จ</title>
        <style>
          @page { size: auto; margin: 0; }
          body { font-family: 'TH SarabunPSK', sans-serif; font-size: 14px; padding: 10px; }
          .receipt { width: 100%; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h3 style="text-align:center;">ใบเสร็จรับพัสดุ</h3>
          <p>หมายเลขพัสดุ: ${parcel.tracking_number}</p>
          <p>ผู้ส่ง: ${parcel.sender}</p>
          <p>ผู้รับ: ${parcel.receiver}</p>
          <p>ที่อยู่: ${parcel.address}</p>
          <p>บริการ: ${parcel.service_type}</p>
          <p>น้ำหนัก: ${parcel.weight} กก.</p>
          <p>ค่าบริการ: ${parcel.price} บาท</p>
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print(); // ✅ จะเปิดหน้าต่างพิมพ์ของเครื่องจริง
      printWindow.onafterprint = () => printWindow.close();
    };
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
