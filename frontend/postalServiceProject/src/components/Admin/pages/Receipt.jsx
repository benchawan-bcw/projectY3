import React, { useState, useRef } from "react";
import axios from "axios";

const Receipt = () => {
  // const [receiverName, setReceiverName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [parcels, setParcels] = useState([]);
  const receiptRef = useRef();

  const fetchParcel = async () => {
    if (!senderName) return;
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

      let data = res.data;
      if (!Array.isArray(data)) data = [data];

      // กรองตามชื่อผู้ส่ง
       const filtered = data.filter((p) =>
      p.sender.toLowerCase().includes(senderName.toLowerCase())
    );

    if (filtered.length === 0) {
      alert("ไม่พบพัสดุของผู้ส่งนี้");
    }

    setParcels(filtered);
  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    setParcels([]);
  }
};

  const handlePrint = () => {
    if (parcels.length === 0) {
      alert("ไม่มีข้อมูลสำหรับพิมพ์");
      return;
    }
    const printWindow = window.open("", "_blank");
    const today = new Date().toLocaleDateString("th-TH");

    printWindow.document.write(`
<html>
  <head>
    <title>ใบเสร็จรับเงินสินค้า</title>
    <style>
      @page { size: auto; margin: 0; }
      body {
        font-family: 'TH SarabunPSK', sans-serif;
        font-size: 16px;
        padding: 0.5rem 1rem;
        line-height: 1.4;
      }
      .receipt {
        width: 100%;
        text-align: left;
      }
      h3 {
        text-align: center;
        margin: 0;
        padding: 0.5rem 0;
        font-size: 20px;
        border-bottom: 1px dashed #000;
      }
      .header {
        text-align: center;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      .section {
        margin: 0.5rem 0;
      }
      .line {
        border-bottom: 1px dashed #000;
        margin: 0.5rem 0;
      }
      .footer {
        text-align: center;
        margin-top: 1.2rem;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <strong>บ้านไปรษณีย์พูลทรัพย์</strong><br/>
        Tel. 035-913-183
      </div>
      <div class="section">
        วันที่: ${today}
      </div>
        <div class="line"></div>
      `);

    //แสดงชื่อผู้รับของผู้ส่งนั้น ๆ ทั้งหมด
    parcels.forEach((p, i) => {
      printWindow.document.write(`
      <div class="receipt">
        <p><b>ชื่อผู้รับ:</b> ${p.receiver || "-"}</p>
        <p><b>เลขที่พัสดุ:</b> ${p.tracking_number || "-"}</p>
        <p><b>ที่อยู่:</b> ${p.address || "-"}</p>
        <p><b>น้ำหนัก:</b> ${p.weight || "-"} กก.</p>
        <p><b>ราคา:</b> ${p.net_price || p.price || "-"} บาท</p>
      </div>
        <div class="line"></div>
    `);
    });
    

    printWindow.document.write(`
      <div class="footer">
        @@@ ขอบคุณที่ใช้บริการค่ะ @@@
      </div>
  </body>
</html>
`);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  return (
    <div style={{ margin: "1rem" }}>
      <h1>ใบเสร็จรับเงินสินค้า</h1>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>กรอกชื่อผู้ส่ง: </label>
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          style={{ marginRight: "1rem" }}
        />
        <button onClick={fetchParcel}>ค้นหา</button>
      </div>

      {parcels && (
        <div
          style={{
            border: "1px solid #000",
            padding: "0.5rem",
            width: "fit-content",
          }}
        >
          <h3 style={{ textAlign: "center" }}>รายชื่อผู้รับของ {senderName}</h3>
          <ul>
            {parcels.map((p) => (
              <li key={p.tracking_number}>
                {p.receiver} — {p.tracking_number}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handlePrint} style={{ marginTop: "1rem" }}>
        🖨 พิมพ์ใบเสร็จ
      </button>
    </div>
  );
};

export default Receipt;
