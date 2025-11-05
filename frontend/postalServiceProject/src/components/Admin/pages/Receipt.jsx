import React, { useState, useRef } from "react";
import axios from "axios";

const Receipt = () => {
  const [senderName, setSenderName] = useState("");
  const [parcels, setParcels] = useState([]);
  const receiptRef = useRef();
  const receiptNumber = `BILL-${Date.now().toString().slice(-4)}`;
  const today = new Date().toLocaleDateString("th-TH");
  const time = new Date().toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const [paperSize, setPaperSize] = useState("58");

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

  const shippingCost = parcels?.shipping_cost || 0;

  // ฟังก์ชันช่วยดึงราคาของอุปกรณ์ตามชื่อ
  function getEquipmentPrice(equipment, keyword) {
    if (!equipment || equipment.length === 0) return 0;

    // รวมราคาทุกชิ้นที่ชื่อมีคำว่า keyword อยู่
    const total = equipment
      .filter((e) => e.name.includes(keyword))
      .reduce((sum, e) => sum + (e.price || 0) * (e.quantity || 1), 0);

    return total;
  }

  const extractAddressData = (address) => {
    if (!address) return { province: "-", zipcode: "-" };

    // ดึงรหัสไปรษณีย์
    const zipMatch = address.match(/\d{5}$/);
    const zipcode = zipMatch ? zipMatch[0] : "-";

    // ดึงชื่อจังหวัด
    const provinceMatch = address.match(/(?:จังหวัด|จ\.)\s*([ก-ฮ]{2,})/);
    const province = provinceMatch ? provinceMatch[1] : "-";

    return { province, zipcode };
  };

  const handlePrint = (paperSize = "58mm") => {
    if (parcels.length === 0) {
      alert("ไม่มีข้อมูลสำหรับพิมพ์");
      return;
    }
    const printWindow = window.open("", "_blank");

    const fontBase = paperSize === "58mm" ? "6px" : "13px";
    const fontHeader = paperSize === "58mm" ? "7px" : "17px";
    const fontFooter = paperSize === "58mm" ? "4px" : "12px";

    printWindow.document.write(`
    <html>
      <head>
        <title>ใบเสร็จรับเงินสินค้า</title>
        <style>
          body { font-family: 'Cordia New', sans-serif; font-size: ${fontBase}; }
          h3 { font-size: ${fontHeader}; }
          .footer { font-size: ${fontFooter}; }

          @page { size: auto; margin: 0; }
        
          .receipt {
            width: 100%;
            text-align: left;
            font-size: 15px;
          }
          h3 {
            text-align: center;
            margin: 0;
            padding: 0.5rem 0;
            font-size: 16px;
            border-bottom: 1px dashed #000;
          }
          .header {
            text-align: center;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 16px;
          }
          .bill-number {
          text-align: center;
          font-weight: bold;
          margin: 0.3rem 0;
          }
          .receipt {
            margin: 0.3rem 0;
          }
          .receipt p {
            margin: 0.3rem 0;
            line-height: 1.1;
          }
          .line {
            border-bottom: 1px dashed #000;
            margin: 0.1rem 0;
          }
          .footer {
            text-align: center;
            margin-top: 0.5rem;
            page-break-after: always; /* 🧾 ตัดกระดาษหลังข้อความนี้ */
            margin-bottom: 1rem;
          }
          .right-info {
            text-align: right;
            font-size: 15px;
            margin-top: 0.5rem;
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <strong>บ้านไปรษณีย์พูลทรัพย์</strong><br/>
            โทร. 035-913-183
          </div>

          <div class="bill-number">
            <div>ใบรับเงิน</div>
          </div>
          <div class="section">
          <div>${receiptNumber || "BILL-0001"} (เลขบิล)</div>
            วันที่: ${today} &nbsp;&nbsp; เวลา: ${time}
          </div>
          <div class="line"></div>
          `);

    //แสดงชื่อผู้รับของผู้ส่งนั้น ๆ ทั้งหมด
    parcels.forEach((p, i) => {
      const { province, zipcode } = extractAddressData(p.address);

      printWindow.document.write(`
            <div class="receipt">
            <p><b>ชื่อผู้รับ:</b> ${p.receiver || "-"}</p>
            <div style="display: flex; justify-content: space-between;">
              <span>${zipcode || "-"}</span>
              <span>${province || "-"}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span><b>กล่อง / ซอง:</b></span>
              <span>${
                getEquipmentPrice(p.equipment, "กล่อง") ||
                getEquipmentPrice(p.equipment, "ซอง")
              }.-</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span><b>รัดกล่อง:</b></span>
              <span>${getEquipmentPrice(p.equipment, "เชือก") || 0}.-</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span><b>บับเบิ้ล:</b></span>
              <span>${getEquipmentPrice(p.equipment, "บับเบิ้ล") || 0}.-</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><b>น้ำหนัก:</b> ${
                p.weight ? (p.weight / 1000).toFixed(2) + " kg" : "-"
              }</span>
              <span>${p.tracking_number || "-"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-right: 5px;">
              <span><b>EMS:</b></span>
              <span>${p.shipping_cost || 0}.-</span>
            </div>

        <div >---------------------</div>
          ${
            p.payment_method === "cash"
              ? `
                <div style="display:flex; justify-content:space-between;">
                  <span><b>รวมทั้งสิ้น:</b></span>
                  <span>${p.total_price || 0}.-</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span><b>เงินสด:</b></span>
                  <span>${p.customer_paid || 0}.-</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span><b>เงินทอน:</b></span>
                  <span>${
                    (p.customer_paid || 0) - (p.total_price || 0)
                  }.-</span>
                </div>
              `
              : p.payment_method === "qr"
              ? `
                <div style="display:flex; justify-content:space-between;">
                  <span><b>รวมทั้งสิ้น:</b></span>
                  <span>${p.total_price || 0}.-</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span><b>ชำระผ่าน QR:</b></span>
                  <span>${p.total_price || 0}.-</span>
                </div>
              `
              : `
                <div style="display:flex; justify-content:space-between;">
                  <span><b>รวมทั้งสิ้น:</b></span>
                  <span>${p.total_price || 0}.-</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span><b>ชำระด้วย:</b></span>
                  <span>-</span>
                </div>
              `
          }


      <div class="line"></div>
      <br>
      </div>
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
