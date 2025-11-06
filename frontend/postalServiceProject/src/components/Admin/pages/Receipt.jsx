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
    <div
      style={{
        width: "500px",
        margin: "40px auto",
        padding: "28px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
        fontFamily: "Prompt, sans-serif",
        color: "#333",
      }}
    >
      {/* หัวเรื่อง */}
      <h1
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          color: "#2563eb",
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        🧾 ใบเสร็จรับเงินสินค้า
      </h1>

      {/* ฟอร์มค้นหา */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "1.5rem",
        }}
      >
        <label
          style={{
            fontWeight: "600",
            color: "#374151",
            whiteSpace: "nowrap",
          }}
        >
          กรอกชื่อผู้ส่ง:
        </label>
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="ชื่อผู้ส่ง"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            outline: "none",
            transition: "0.3s",
          }}
          onFocus={(e) => (e.target.style.border = "1px solid #60a5fa")}
          onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
        />
        <button
          onClick={fetchParcel}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#1e40af")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
        >
          🔍 ค้นหา
        </button>
      </div>

      {/* รายชื่อผู้รับ */}
      {parcels && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#f9fafb",
            minHeight: "200px",
          }}
        >
          <h3
            style={{
              textAlign: "center",
              marginBottom: "0.75rem",
              color: "#374151",
              fontWeight: "600",
            }}
          >
            รายชื่อผู้รับของ {senderName}
          </h3>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {parcels.map((p) => (
              <li
                key={p.tracking_number}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#fff",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f1f5f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fff")
                }
              >
                <span>👤 {p.receiver}</span>
                <span style={{ fontWeight: "500", color: "#2563eb" }}>
                  #{p.tracking_number}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ปุ่มพิมพ์ */}
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={handlePrint}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontWeight: "600",
            fontSize: "15px",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
        >
          🖨 พิมพ์ใบเสร็จ
        </button>
      </div>
    </div>
  );
};

export default Receipt;
