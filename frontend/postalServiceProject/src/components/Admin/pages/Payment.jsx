import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const [parcels, setParcels] = useState([]); // array ของพัสดุ
  const [parcelData, setParcelData] = useState(null); // ข้อมูลรวม sender, equipment, totalShipping
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
          { auth: { username: "admin", password: "bands" } }
        );

        if (res.data && res.data.length > 0) {
          const latestParcel = res.data[0];
          const latestSender = latestParcel.sender;
          const latestDate = new Date(latestParcel.update_at).toDateString();

          // กรองพัสดุทั้งหมดของผู้ส่งล่าสุด
          const parcelsOfLatestSender = res.data.filter(
            (p) =>
              p.sender === latestSender &&
              new Date(p.update_at).toDateString() === latestDate
          );

          // คำนวณราคาของแต่ละพัสดุ
          const parcelsWithTotal = parcelsOfLatestSender.map((p) => {
            const equipmentPrice =
              p.equipment?.reduce((sum, item) => sum + (item.price || 0), 0) ||
              0;
            const totalPrice = equipmentPrice + (p.shipping_cost || 0);
            return { ...p, totalPrice };
          });

          // netPrice รวมทั้งหมด
          const netPrice = parcelsWithTotal.reduce(
            (sum, p) => sum + p.totalPrice,
            0
          );

          setParcelData({
            sender: latestSender,
            parcels: parcelsWithTotal,
            netPrice,
          });
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

  // รวมอุปกรณ์ทั้งหมดของผู้ส่งล่าสุด
  const allEquipment =
    parcelData?.parcels?.flatMap((p) => p.equipment || []) || [];
  const totalEquipmentPrice = allEquipment.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  const totalShipping =
    parcelData?.parcels?.reduce((sum, p) => sum + (p.shipping_cost || 0), 0) ||
    0;

  // ราคาทั้งหมดรวมค่าส่ง
  const totalPriceNumber = totalEquipmentPrice + totalShipping;

  // QR
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
          setResult({
            ...res.data,
            qr_image: res.data.qrCode, // map ให้ตรงกับ component
          });
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
  if (!parcelData) return <p>ไม่พบข้อมูลพัสดุ</p>;

  const handleSelectPayment = async () => {
    try {
      if (paymentMethod === "cash" && Number(customerPaid) < totalPriceNumber) {
        alert("จำนวนเงินที่ลูกค้าชำระไม่เพียงพอ");
        return;
      }

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
    const provinceMatch = address.match(/(?:จังหวัด|จ\.)\s*([ก-ฮ\s]{2,})/);
    const province = provinceMatch
      ? provinceMatch[1].trim().replace(/\s+/g, " ")
      : "-";

    return { province, zipcode };
  };

  const handleUpdatePayment = async (paperSize = "58mm") => {
    if (paymentMethod === "cash" && Number(customerPaid) < totalPriceNumber) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ส่ง _id ของแต่ละพัสดุและราคาของมัน
      const parcelsToUpdate = parcelData.parcels.map((p) => ({
        _id: p._id.trim(),
        total_price: p.totalPrice, // ราคาของพัสดุนี้
      }));

      const res = await axios.put(
        `http://localhost:4000/admin-ban-poolsub/updatePayment`,
        {
          parcels: parcelsToUpdate,
          net_price: parcelData.netPrice,
          payment_method: paymentMethod,
          customer_paid:
            paymentMethod === "cash"
              ? Number(customerPaid)
              : parcelData.netPrice,
        },
        { auth: { username: "admin", password: "bands" } }
      );

      const updatedParcels = parcelData.parcels.map((p) => ({
        ...p,
        payment_method: paymentMethod,
        customer_paid:
          paymentMethod === "cash" ? Number(customerPaid) : parcelData.netPrice,
      }));

      setParcelData({ ...parcelData, parcels: updatedParcels });

      console.log(res.data);
      alert("บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว");

      // ✅ เรียกฟังก์ชันพิมพ์ใบเสร็จหลังอัปเดตสำเร็จ
      if (parcelData.parcels.length > 0) {
        const today = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();

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
            <<div class="receipt">
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
        updatedParcels.forEach((p) => {
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

      
      <div style="display:flex; justify-content:space-between;">
                  <span><b>ค่าอุปกรณ์ทั้งหมด:</b></span>
                  <span>${
                    paymentMethod === "cash" ? totalPriceNumber : 0
                  }.-</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span><b>ค่าส่ง:</b></span>
                  <span>${paymentMethod === "cash" ? totalShipping : 0}.-</span>
                </div>
       <div style="display:flex; justify-content:space-between;">
                  <span><b>รวมทั้งหมด:</b></span>
                  <span>${
                    paymentMethod === "cash" ? totalPriceNumber : 0
                  }.-</span>
                </div>
      <div style="display:flex; justify-content:space-between;">
                  <span><b>เงินสด:</b></span>
                    <span>${
                      paymentMethod === "cash"
                        ? customerPaid
                        : p.total_price || 0
                    }.-</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span><b>เงินทอน:</b></span>
                  <span>${
                    paymentMethod === "cash"
                      ? (p.customer_paid || 0) - totalPriceNumber
                      : 0
                  }.-</span>
                </div>
      `);

      
    });
    printWindow.document.write(`
      
    `);

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
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAndSaveForQrCode = async (paperSize = "58mm") => {
    setLoading(true);
    setError(null);

    try {
      parcelData.parcels.forEach((p) => console.log("ก่อนอัปเดต _id:", p._id));
      // สร้าง array ของพัสดุที่จะอัปเดต
      const parcelsToUpdate = parcelData.parcels.map((p) => ({
        _id: p._id.trim(), // ✅ ต้องเป็น _id
        total_price: p.totalPrice,
      }));
      console.log("Parcels to update:", parcelsToUpdate);

      const customerPaidValue =
        paymentMethod === "qr"
          ? parcelData.netPrice
          : Number(customerPaid || 0);

      // เรียก API updatePayment
      const res = await axios.put(
        "http://localhost:4000/admin-ban-poolsub/updatePaymentForQrCode",
        {
          parcels: parcelsToUpdate, // array ของ {_id, total_price}
          payment_method: paymentMethod,
          customer_paid: customerPaidValue,
          receipt_number: receiptNumber,
        },
        { auth: { username: "admin", password: "bands" } }
      );

      if (!res.data || res.data.modifiedCount === 0) {
        setError("ไม่สามารถอัปเดตข้อมูลพัสดุได้");
        return;
      }

      setResult({
        success: true,
        modifiedCount: res.data.modifiedCount,
        qr_image: res.data.qr_image,
      });

      alert(
        `บันทึกข้อมูลการชำระเงินด้วย QR สำเร็จ (${res.data.modifiedCount} พัสดุ) กำลังพิมพ์ใบเสร็จ...`
      );

      if (paymentMethod === "qr" && res.data.qr_image) {
        const printWindow = window.open("", "_blank");
        const doc = printWindow.document;

        // พิมพ์ใบเสร็จ QR
        const fontBase = paperSize === "58mm" ? "10px" : "13px";
        const fontHeader = paperSize === "58mm" ? "7px" : "17px";
        const fontFooter = paperSize === "58mm" ? "7px" : "12px";

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
                  margin-bottom: 2rem;
                }
              </style>
            </head>
            <body>
            <div class="receipt">
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

        // ✅ ถ้ามี QR ให้รอโหลดก่อนพิมพ์
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

  const handlePrint = (paperSize = "58mm") => {
    if (!parcel) {
      alert("ไม่มีข้อมูลพัสดุสำหรับพิมพ์");
      return;
    }

    const fontBase = paperSize === "58mm" ? "10px" : "13px";
    const fontHeader = paperSize === "58mm" ? "7px" : "17px";
    const fontFooter = paperSize === "58mm" ? "7px" : "12px";

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

  const handlePrintAndSaveForCash = async (paperSize = "58mm") => {
    // ✅ ตรวจสอบก่อนว่าเงินที่ลูกค้าจ่ายครบหรือยัง
    if (paymentMethod === "cash" && Number(customerPaid) < totalPriceNumber) {
      alert("จำนวนเงินที่ลูกค้าชำระน้อยกว่าจำนวนที่ต้องชำระ");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ 1. บันทึกข้อมูลการชำระเงินลงฐานข้อมูล

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
        alert("✅ อัปเดตข้อมูลการชำระเงินสำเร็จ กำลังพิมพ์ใบเสร็จ...");

        // ✅ 2. พิมพ์ใบเสร็จหลังบันทึกสำเร็จ
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
              .footer { font-size: ${fontFooter}; line-height: 1.1; }
              .receipt { width: 100%; text-align: left; }
              .line { border-bottom: 1px dashed #000; margin: 0.5rem 0; }
              .qr { text-align: center; margin-top: 1rem; }
              .qr p { margin-bottom: 2rem; font-weight: bold; font-size: 20px; margin: 0.1rem 0; line-height: 1.1; }
              .qr img { width: 150px; height: 150px; margin-top: 0.5rem; margin-buttom: 2rem; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <h3>📦 ใบเสร็จรับเงิน</h3>
              <div class="line"></div>
              <p>วันที่: ${today} ${time}</p>
              <p>เลขที่ใบเสร็จ: ${receiptNumber}</p>
              <p>วิธีชำระเงิน: ${
                paymentMethod === "cash" ? "เงินสด" : "QR พร้อมเพย์"
              }</p>
              <p>ยอดรวม: ${totalPriceNumber} บาท</p>
              <p>ลูกค้าชำระ: ${customerPaid} บาท</p>
              <p>เงินทอน: ${change} บาท</p>
              <div class="line"></div>

              ${
                paymentMethod === "qr" && result?.qr_image
                  ? `<div class="qr">
                       <p>สแกนเพื่อชำระเงิน</p>
                       <img id="qrImage" src="${result.qr_image}" alt="QR Code"/>
                     </div>`
                  : ""
              }

              <div class="footer">
                <p>ขอบคุณที่ใช้บริการ 💙</p>
              </div>
            </div>
          </body>
        </html>
      `);

        doc.close();

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
        หน้าชำระเงิน
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

          {allEquipment.length > 0 ? (
            <div>
              {parcelData.parcels.map((p, index) => (
                <div
                  key={index}
                  className="border rounded-lg bg-white p-3 mb-3"
                  style={{ borderRadius: "10px" }}
                >
                  <h5 className="mb-2" style={{ textAlign: "left" }}>
                    Tracking: {p.tracking_number}
                  </h5>
                  {p.equipment.length > 0 ? (
                    <div className="space-y-1">
                      {p.equipment.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #e5e7eb", // เส้นคั่นเป็นสีเทาอ่อน
                            paddingBottom: "4px",
                            marginBottom: "4px",
                            listStyleType: "none",
                          }}
                        >
                          <span>{item.name}</span>
                          <span>{item.price} บาท</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">ไม่มีอุปกรณ์เพิ่มเติม</p>
                  )}
                  <div className="flex justify-between mt-2">
                    <span>ค่าส่ง</span>
                    <span>{p.shipping_cost} บาท</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>ราคารวม</span>
                    <span>{p.totalPrice} บาท</span>
                  </div>
                </div>
              ))}
            </div>
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
              {totalShipping.toFixed(2)} บาท
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
            onClick={handleSelectPayment}
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

          {/* ปุ่มบันทึกข้อมูล */}
          <button
            onClick={handleUpdatePayment}
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
            บันทึกข้อมูล
          </button>
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
            {result?.qr_image ? (
              <img
                src={result.qr_image}
                alt="QR Code สำหรับชำระเงิน"
                style={{ width: "200px", height: "200px", borderRadius: "8px" }}
              />
            ) : (
              <p>กำลังสร้าง QR Code...</p>
            )}
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
            onClick={handlePrintAndSaveForQrCode}
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

          {/* Loading indicator (ถ้ามี) */}
          {loading && (
            <p className="mt-3 text-secondary" style={{ fontSize: "14px" }}>
              ⏳ กำลังประมวลผล...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;
