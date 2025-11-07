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
    // ตรวจสอบว่าลูกค้าจ่ายครบหรือยัง
    if (paymentMethod === "cash" && Number(customerPaid) < totalPriceNumber) {
      return;
    }

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
        alert("อัปเดตข้อมูลการชำระเงินสำเร็จ");
      } else {
        setError("ไม่พบข้อมูลพัสดุที่อัปเดต");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาด:", err);
      setError("อัปเดตข้อมูลไม่สำเร็จ");
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

    const fontBase = paperSize === "58mm" ? "10px" : "13px";
    const fontHeader = paperSize === "58mm" ? "7px" : "17px";
    const fontFooter = paperSize === "58mm" ? "4px" : "12px";

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
        body { font-family: 'Cordia New', sans-serif; font-size: ${fontBase}; }
        h3 { font-size: ${fontHeader}; }
        .footer { font-size: ${fontFooter}; 
        line-height: 1.1; 
        }

        .receipt { width: 100%; text-align: left; }
        
        .line {
          border-bottom: 1px dashed #000;
          margin: 0.5rem 0;
        }
        .qr {
          text-align: center;
          margin-top: 1rem;
        }

        .qr p {
        margin-bottom: 2rem;
          font-weight: bold;
          font-size: 20px;
          margin: 0.1rem 0;
          line-height: 1.1;
        }
        .qr img {
          width: 150px;
          height: 150px;
          margin-top: 0.5rem;
          margin-buttom: 2rem;
        }
      </style>
    </head>
        ${
          paymentMethod === "qr" && result?.qr_image
            ? `<div class="qr">
                 <p>สแกนเพื่อชำระเงิน</p>
                 <img id="qrImage" src="${result.qr_image}" alt="QR Code"/>
               </div>`
            : ""
        }
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
      {/* หัวข้อใบเสร็จ */}
      <h1
        className="text-center mb-4"
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "24px",
          color: "#dc2626",
        }}
      >
        ใบเสร็จชำระเงิน
      </h1>

      <div
        className="p-4 rounded-2xl shadow-md"
        style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        {/* รายละเอียดอุปกรณ์ */}
        <div className="mb-4">
          <h4
            style={{
              fontSize: "20px",
              color: "black",
              paddingBottom: "6px",
              marginBottom: "10px",
              textAlign: "left",
            }}
          >
            รายละเอียดอุปกรณ์
          </h4>

          {equipment.length > 0 ? (
            <ul
              className="border rounded-lg divide-y divide-gray-200 list-none bg-white p-3"
              style={{ borderRadius: "10px" }}
            >
              {equipment.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between p-2 hover:bg-gray-50 transition "
                  style={{
                    fontSize: "15px",
                    borderBottom:
                      index !== equipment.length - 1
                        ? "1px solid #D9D9D9"
                        : "none",
                  }}
                >
                  <span>{item.name}</span>
                  <span style={{ fontWeight: "500" }}>
                    {item.price?.toFixed(2)} บาท
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-left mt-2">
              ไม่มีอุปกรณ์เพิ่มเติม
            </p>
          )}
        </div>

        {/* สรุปราคา */}
        <div
          className="bg-white p-3 rounded-lg border"
          style={{
            fontSize: "15px",
            borderRadius: "10px",
            lineHeight: "1.8",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex justify-between">
            <span>ค่าอุปกรณ์ทั้งหมด</span>
            <span style={{ fontWeight: "500" }}>
              {totalEquipmentPrice.toFixed(2)} บาท
            </span>
          </div>
          <div className="flex justify-between">
            <span>ค่าส่ง</span>
            <span style={{ fontWeight: "500" }}>
              {shippingCostNumber.toFixed(2)} บาท
            </span>
          </div>

          <hr className="my-2 border-gray-300" />

          <div className="flex justify-between text-lg font-bold text-green-700">
            <span>รวมทั้งหมด</span>
            <span>{totalPriceNumber.toFixed(2)} บาท</span>
          </div>
        </div>
      </div>

      {/* วิธีชำระเงิน */}
      <div
        className="d-flex justify-content-center align-items-center gap-4 mt-4"
        style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px 20px",
        }}
      >
        <label
          className="d-flex align-items-center justify-content-center gap-2 p-3 rounded w-50"
          style={{
            cursor: "pointer",
            backgroundColor: paymentMethod === "cash" ? "#dcfce7" : "white",
            border:
              paymentMethod === "cash"
                ? "2px solid #22c55e"
                : "1px solid #d1d5db",
            transition: "all 0.2s ease",
          }}
        >
          <input
            type="radio"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ accentColor: "#22c55e", transform: "scale(1.2)" }}
          />
          <span style={{ fontWeight: "500" }}>เงินสด</span>
        </label>

        <label
          className="d-flex align-items-center justify-content-center gap-2 p-3 rounded w-50"
          style={{
            cursor: "pointer",
            backgroundColor: paymentMethod === "qr" ? "#e0f2fe" : "white",
            border:
              paymentMethod === "qr"
                ? "2px solid #3b82f6"
                : "1px solid #d1d5db",
            transition: "all 0.2s ease",
          }}
        >
          <input
            type="radio"
            value="qr"
            checked={paymentMethod === "qr"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ accentColor: "#3b82f6", transform: "scale(1.2)" }}
          />
          <span style={{ fontWeight: "500" }}>QR Code</span>
        </label>
      </div>

      {/* 🔹 ส่วนการชำระด้วยเงินสด */}
      {paymentMethod === "cash" && (
        <div
          className="mt-4 p-4 shadow-sm border rounded-3"
          style={{ backgroundColor: "#f9fafb" }}
        >
          {/* ช่องกรอกจำนวนเงิน */}
          <div className="mb-3">
            <label
              className="form-label"
              style={{
                fontSize: "20px",
                fontWeight: "500",
                color: "black",
                display: "block",
                textAlign: "left",
                marginBottom: "6px",
              }}
            >
              จำนวนเงินที่ลูกค้าชำระ:
            </label>
            <input
              type="number"
              value={customerPaid}
              onChange={(e) => setCustomerPaid(e.target.value)}
              className="form-control form-control-lg text-center"
              placeholder="ระบุจำนวนเงิน (บาท)"
              style={{
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
              }}
            />
          </div>

          {/* ปุ่มคำนวณ */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-100 py-2"
            style={{
              backgroundColor: "#4A70A9",
              color: "EFECE3", // override ให้ตัวหนังสือเป็นดำ
              borderRadius: "8px",
              fontSize: "16px",
              height: "50px",
              transition: "0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#8FABD4")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#4A70A9")}
          >
            {loading ? "กำลังประมวลผล..." : "คำนวณเงินทอน"}
          </button>

          {/* แสดงผลลัพธ์หลังคำนวณ */}
          {result && result.success && (
            <div
              className="py-3 rounded-3"
              style={{
                backgroundColor: "#ecfdf5",
                border: "1px solid #d1fae5",
                marginTop: "8px",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                <span>ลูกค้าชำระ</span>
                <span style={{ fontWeight: "600" }}>
                  {result.customer_paid} บาท
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#059669",
                  fontWeight: "600",
                }}
              >
                <span>เงินทอน</span>
                <span>{result.change} บาท</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔹 QR Code */}
      {paymentMethod === "qr" && result?.qr_image && (
        <div
          className="mt-4 p-4 shadow-sm border rounded-3 text-center"
          style={{ backgroundColor: "#f9fafb" }}
        >
          {/* รูป QR Code */}
          <div
            className="d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              width: "240px",
              height: "240px",
              margin: "0 auto",
            }}
          >
            <img
              src={result.qr_image}
              alt="QR Code สำหรับชำระเงิน"
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* ยอดชำระ */}
          <p
            className="mt-3 mb-3"
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: "#111827",
            }}
          >
            ยอดชำระ:{" "}
            <span style={{ color: "#059669", fontWeight: "700" }}>
              {totalPriceNumber.toFixed(2)} บาท
            </span>
          </p>

          {/* ปุ่มพิมพ์ใบเสร็จ */}
          <button
            onClick={handlePrint}
            className="btn w-100 mb-2"
            style={{
              backgroundColor: "#44444E",
              color: "#D3DAD9",
              borderRadius: "8px",
              fontSize: "16px",
              height: "45px",
              fontWeight: "500",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#c7382b")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#E14434")}
          >
            <i class="bi bi-printer-fill" style={{ marginRight: "8px" }}></i>
            พิมพ์ใบเสร็จ
          </button>

          {/* ปุ่มบันทึกข้อมูล */}
          {/* <button
            onClick={handleUpdatePayment}
            disabled={loading}
            className="btn btn-success btn-lg w-100"
            style={{
              color: "black",
              borderRadius: "8px",
              fontSize: "18px",
              height: "50px",
              fontWeight: "500",
            }}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button> */}

          {/* Loading indicator (ถ้ามี) */}
          {loading && (
            <p className="mt-3 text-secondary" style={{ fontSize: "14px" }}>
              ⏳ กำลังประมวลผล...
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleUpdatePayment}
        disabled={loading}
        className="btn-lg w-100 mb-2"
        style={{
          backgroundColor: "#5EABD6",
          color: "#16476A", // override สีข้อความ (Bootstrap ใช้สีขาวเริ่มต้น)
          borderRadius: "10px",
          fontSize: "18px",
          height: "50px",
          width: "70%",
          marginTop: "1rem",
        }}
      >
        {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
      </button>
    </div>
  );
};

export default Payment;
