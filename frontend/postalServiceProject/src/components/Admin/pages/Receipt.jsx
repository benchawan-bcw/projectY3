// พิมพ์ใบเสร็จ
import React, { useEffect, useState } from "react";
import axios from "axios";
import jspdf, { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Receipt = () => {
  const [receiverName, setReceiverName] = useState("");
  const [parcel, setParcel] = useState(null);
  const [paperWidth, setPaperWidth] = useState(80); // mm

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

      if (filtered.length === 0) {
        alert("ไม่พบพัสดุของผู้รับนี้");
        setParcel([]);
      } else {
        setParcel(filtered);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setParcel([]);
    }
  };

  // สร้าง pdf
  const handleGeneratePDF = async () => {
    if (!parcel) return;

    const element = document.getElementById("receiptContent"); // div ใบเสร็จ
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [paperWidth, 200],
    });

    // ปรับขนาดรูปภาพให้พอดีกับกระดาษ
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = paperWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`receipt_${parcel.tracking_number}.pdf`);
  };

  return (
    <div style={{ margin: "20px", fontFamily: "sans-serif" }}>
      <h1>ใบเสร็จ</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>กรอกชื่อผู้รับ</label>
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
          value={paperWidth}
          onChange={(e) => setPaperWidth(Number(e.target.value))}
        >
          <option value={58}>🧾 58 mm</option>
          <option value={80}>🧾 80 mm</option>
        </select>
      </div>

      {parcel && (
        <div
          id="receiptContent"
          style={{
            width: "300px",
            padding: "10px",
            border: "1px solid #000",
            fontFamily: "sans-serif",
          }}
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
      <button onClick={handleGeneratePDF} style={{ marginTop: "10px" }}>
        🖨 พิมพ์ใบเสร็จ
      </button>
    </div>
  );
};

export default Receipt;
