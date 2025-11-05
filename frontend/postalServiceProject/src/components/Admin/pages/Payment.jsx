import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const [parcel, setParcel] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerPaid, setCustomerPaid] = useState("");
  const [result, setResult] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const receiptNumber = `BILL-${Date.now().toString().slice(-4)}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/admin-ban-poolsub/getParcels",
          {
            auth: { username: "admin", password: "bands" },
          }
        );
        if (res.data && res.data.length > 0) {
          setParcel(res.data[0]); // เอารายการล่าสุด (index 0)
        } else {
          setError("ไม่พบข้อมูลพัสดุ");
        }
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, []);

  // ดึงข้อมูลจากพัสดุ
  const equipment = parcel?.equipment || [];
  const shippingCost = parcel?.shipping_cost || 0;

  // คำนวณราคารวมอุปกรณ์
  const totalEquipmentPrice = equipment.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  // คำนวณราคารวมทั้งหมด (รวมค่าส่ง)
  const shippingCostNumber =
    typeof shippingCost === "number" ? shippingCost : shippingCost.total || 0;
  const totalPriceNumber = totalEquipmentPrice + shippingCostNumber;

  const handleUpdatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.put(
        "http://localhost:4000/admin-ban-poolsub/updatePayment",
        {
          total_price: totalPriceNumber,
          net_price: totalPriceNumber,
          receipt_number: receiptNumber,
          payment_method: paymentMethod,
          customer_paid:
            paymentMethod === "cash" ? Number(customerPaid) : totalPriceNumber,
        },
        {
          auth: { username: "admin", password: "bands" },
        }
      );

      if (res.data && res.data.parcel) {
        const parcel = res.data.parcel;
        setPaymentMethod(parcel.paymentMethod || "ไม่ระบุ");
        setTotalPrice(parcel.total_price);
        setCustomerPaid(parcel.customer_paid || 0);
        alert("อัปเดตข้อมูลการชำระเงินสำเร็จ ✅");
      } else {
        setError("ไม่พบข้อมูลพัสดุที่อัปเดต");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาด:", err);
      setError("อัปเดตข้อมูลไม่สำเร็จ ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const autoGenerateQR = async () => {
      if (paymentMethod === "qr") {
        try {
          setLoading(true);
          console.log("สร้าง QR อัตโนมัติสำหรับยอด:", totalPriceNumber);

          const res = await axios.post(
            "http://localhost:4000/admin-ban-poolsub/selectPayment",
            { paymentMethod: "qr", total_price: totalPriceNumber },
            { auth: { username: "admin", password: "bands" } }
          );
          setResult(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else if (paymentMethod === "cash") {
        setResult(null);
      }
    };
    autoGenerateQR();
  }, [paymentMethod, totalPriceNumber]);

  if (loading) return <p>กำลังโหลดข้อมูล...</p>;
  if (error) return <p>{error}</p>;
  if (!parcel) return null;

  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log("ส่งข้อมูลชำระเงิน:", {
        paymentMethod,
        total_price: totalPriceNumber,
        customer_paid:
          paymentMethod === "cash" ? Number(customerPaid) : undefined,
      });

      const res = await axios.post(
        "http://localhost:4000/admin-ban-poolsub/selectPayment",
        {
          paymentMethod,
          total_price: totalPriceNumber,
          customer_paid:
            paymentMethod === "cash" ? Number(customerPaid) : undefined,
        },
        {
          auth: { username: "admin", password: "bands" },
        }
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการชำระเงิน");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (paperSize = "58mm") => {
    if (!parcel) {
      alert("ไม่มีข้อมูลพัสดุสำหรับพิมพ์");
      return;
    }

    const fontBase = paperSize === "58mm" ? "9px" : "13px";
    const fontHeader = paperSize === "58mm" ? "10px" : "17px";
    const fontFooter = paperSize === "58mm" ? "8px" : "12px";

    const today = new Date().toLocaleDateString("th-TH");
    const time = new Date().toLocaleTimeString("th-TH");
    const receiptNumber = `BILL-${Date.now().toString().slice(-4)}`;

    const change =
      paymentMethod === "cash"
        ? Number(customerPaid || 0) - Number(totalPriceNumber || 0)
        : 0;

    // ✅ สร้างหน้าพิมพ์ใหม่
    const printWindow = window.open("", "_blank");
    const doc = printWindow.document;

    doc.write(`
  <html>
    <head>
      <title>ใบเสร็จรับเงินสินค้า</title>
      <style>
        @page { size: auto; margin: 0; }
        body { font-family: 'TH SarabunPSK', sans-serif; font-size: ${fontBase}; }
        h3 { font-size: ${fontHeader}; }
        .footer { font-size: ${fontFooter}; }

        .receipt { width: 100%; text-align: left; }
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
        .bill-number {
          text-align: center;
          font-weight: bold;
          margin: 0.3rem 0;
        }
        .section { margin: 0.5rem 0; }
        .line {
          border-bottom: 1px dashed #000;
          margin: 0.5rem 0;
        }
        .footer {
          text-align: center;
          margin-top: 1.2rem;
          font-size: 16px;
          margin-bottom: 1rem;
        }
        .right-info {
          text-align: right;
          font-size: 14px;
          margin-top: 0.5rem;
          line-height: 1.2;
        }
        .qr {
          text-align: center;
          margin-top: 1rem;
        }
        .qr img {
          width: 150px;
          height: 150px;
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
          ใบรับเงินเลขที่: ${receiptNumber}
        </div>
        <div class="section">
          วันที่: ${today} &nbsp;&nbsp; เวลา: ${time}
        </div>
        <div class="line"></div>

        <div class="section">
          <p><b>ชื่อผู้ส่ง:</b> ${parcel.sender || "-"}</p>
          <p><b>ชื่อผู้รับ:</b> ${parcel.receiver || "-"}</p>
          <p><b>EMS:</b> ${parcel.shipping_cost || 0} บาท</p>
        </div>
        ${
          parcel.equipment && parcel.equipment.length > 0
            ? `<div class="section">
                <b>อุปกรณ์เพิ่มเติม:</b>
                <ul>
                  ${parcel.equipment
                    .map(
                      (eq) => `<li>${eq.name || "-"}: ${eq.price || 0} บาท</li>`
                    )
                    .join("")}
                </ul>
              </div>
              <div class="line"></div>`
            : ""
        }

        <div class="right-info">
          <p>ค่าอุปกรณ์: ${totalEquipmentPrice} บาท</p>
          <p><b>ยอดรวมทั้งหมด: ${totalPriceNumber} บาท</b></p>
          ${
            paymentMethod === "cash"
              ? `<p>ชำระเงินสด: ${customerPaid || 0} บาท</p>
                 <p>เงินทอน: ${change || 0} บาท</p>`
              : ""
          }
        </div>

        ${
          paymentMethod === "qr" && result?.qr_image
            ? `<div class="qr">
                 <p>📱 สแกนเพื่อชำระเงิน</p>
                 <img id="qrImage" src="${result.qr_image}" alt="QR Code"/>
               </div>`
            : ""
        }

        <div class="footer">@ ขอบคุณที่ใช้บริการค่ะ @</div>
      </div>
    </body>
  </html>
  `);

    doc.close();

    // ✅ ถ้ามี QR ให้รอโหลดภาพก่อนพิมพ์
    const qrImage = printWindow.document.getElementById("qrImage");
    if (qrImage) {
      qrImage.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };
    } else {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };
    }
  };

  return (
    <div
    // style={{
    //   height: "300px",
    //   overflowY: "scroll",
    //   scrollbarWidth: "none",
    //   msOverflowStyle: "none",
    // }}
    >
      {/* <style>{`div::-webkit-scrollbar { display: none; }`}</style> */}

      <h3>ใบเสร็จชำระเงิน</h3>

      <p>รายละเอียดอุปกรณ์</p>
      {equipment.length > 0 ? (
        <ul className="border rounded-lg divide-y">
          {equipment.map((item, index) => (
            <li
              key={index}
              className="flex justify-between p-2 hover:bg-gray-50 transition"
            >
              <span>{item.name}</span> : &nbsp;
              <span>{item.price?.toFixed(2)} บาท</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">ไม่มีอุปกรณ์เพิ่มเติม</p>
      )}
      <p>ค่าอุปกรณ์ : {totalEquipmentPrice.toFixed(2)} บาท</p>

      <p>ค่าส่ง : {shippingCostNumber.toFixed(2)} บาท</p>
      <p className="font-bold mt-2 text-lg">
        รวมทั้งหมด : {totalPriceNumber.toFixed(2)} บาท
      </p>

      {/* 🔹 เลือกวิธีชำระ */}
      <div className="mt-3">
        <label className="mr-2">
          <input
            type="radio"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          เงินสด
        </label>
        <label className="ml-4">
          <input
            type="radio"
            value="qr"
            checked={paymentMethod === "qr"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          QR Code
        </label>
      </div>

      {/* 🔹 ส่วนการชำระด้วยเงินสด */}
      {paymentMethod === "cash" && (
        <div className="mt-3">
          <label>จำนวนเงินที่ลูกค้าชำระ:</label>
          <input
            type="number"
            value={customerPaid}
            onChange={(e) => setCustomerPaid(e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* ปุ่มคำนวณ */}
          <button
            onClick={handlePayment}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-black px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "กำลังประมวลผล..." : "คำนวณ"}
          </button>

          {/* ปุ่มบันทึกข้อมูล */}
          <button
            onClick={handleUpdatePayment}
            className="mt-3 bg-green-600 hover:bg-green-700 text-black px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>

          {/* แสดงผลลัพธ์หลังคำนวณ */}
          {result && result.success && (
            <div className="mt-5 border-t pt-3 text-center">
              <p>💵 ลูกค้าชำระ: {result.customer_paid} บาท</p>
              <p>💰 เงินทอน: {result.change} บาท</p>
            </div>
          )}

          {/* ถ้ามี error */}
          {result && !result.success && (
            <p className="text-red-600 mt-3">{result.message}</p>
          )}
        </div>
      )}

      {/* 🔹 QR Code */}
      {paymentMethod === "qr" && result?.qr_image && (
        <div className="mt-4 text-center">
          <h4 className="font-medium">📱 สแกนเพื่อชำระเงิน</h4>
          <img
            src={result.qr_image}
            alt="QR Code สำหรับชำระเงิน"
            className="w-56 h-56 mx-auto mt-2 border"
          />
          <p className="mt-2">ยอดชำระ: {totalPriceNumber.toFixed(2)} บาท</p>

          <button
            onClick={handlePrint}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-black px-4 py-2 rounded w-full"
          >
            🖨 พิมพ์ใบเสร็จ
          </button>

          <button
            onClick={handleUpdatePayment}
            className="mt-3 bg-green-600 hover:bg-green-700 text-black px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      )}

      {result && !result.success && (
        <p className="text-red-600 mt-3">{result.message}</p>
      )}
    </div>
  );
};

export default Payment;
