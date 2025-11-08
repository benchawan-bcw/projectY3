// API ของแอดมิน
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Parcels = require("../models/parcels");
const { getThaiPostToken } = require("../config/memberToken");
const qrcode = require("qrcode");
const generatePayload = require("promptpay-qr");

const dotenv = require("dotenv");
dotenv.config();

// โหลดไฟล์ JSON
const dataPath = path.join(__dirname, "../config/islandsPostCode.json");
const islandData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const emsRatesPath = path.join(__dirname, "../config/emsCost.json");
const emsRates = JSON.parse(fs.readFileSync(emsRatesPath, "utf-8"));
const equipmentPath = path.join(__dirname, "../config/equipmentPrice.json");
const equipment = JSON.parse(fs.readFileSync(equipmentPath, "utf-8"));

// ลงทะเบียนพัสดุใหม่
exports.registerParcel = async (req, res) => {
  try {
    const {
      tracking_number,
      sender,
      sender_phone,
      receiver,
      receiver_phone,
      address,
      weight,
      equipment,
      service_type,
      postcode,
      isIsland = false,
      packagingCost = 0,
      total_price = 0,
    } = req.body;

    if (
      !tracking_number ||
      !sender ||
      !sender_phone ||
      !receiver ||
      !receiver_phone ||
      !address ||
      !weight ||
      !equipment
    ) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    const exists = await Parcels.findOne({ tracking_number });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Tracking number already exists" });
    }

    // ดึง token
    let token;
    try {
      token = await getThaiPostToken();
    } catch (err) {
      console.error("Error getting ThaiPost token:", err.message);
      return res
        .status(500)
        .json({ message: "ไม่สามารถดึง token ไปรษณีย์ไทยได้" });
    }

    // ดึงข้อมูล tracking
    let trackingInfo;
    try {
      const response = await fetch(
        "https://trackapi.thailandpost.co.th/post/api/v1/track",
        {
          status: "all",
          language: "TH",
          barcode: [tracking_number],
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await response.text();
      // debug
      console.log("ThaiPost track response:", text);

      try {
        trackingInfo = JSON.parse(text);
      } catch {
        console.warn(
          "ThaiPost returned non-JSON response, set status เป็น 'รออัปเดต'"
        );
        trackingInfo = {};
      }
    } catch (err) {
      console.error("Error fetching tracking info:", err);
      trackingInfo = {};
    }

    console.log("Mongo connected:", mongoose.connection.readyState);
    console.log("req.body:", req.body);

    const shippingCost = calculateEmsCost(weight, isIsland, packagingCost);
    const total_equipment = Array.isArray(equipment)
      ? equipment.reduce((sum, item) => sum + (item.price || 0), 0)
      : 0;
    const net_price = total_price;

    const parcel = await Parcels.create({
      tracking_number,
      sender,
      sender_phone,
      receiver,
      receiver_phone,
      address,
      weight,
      equipment,
      service_type: service_type || "EMS",
      status: trackingInfo?.status || "รออัปเดต",
      shipping_cost: shippingCost,
      total_equipment,
      total_price,
      net_price,
      update_at: new Date(),
    });

    res.status(201).json({ message: "ลงทะเบียนพัสดุสำเร็จ", parcel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ดึงข้อมูลพัสดุทั้งหมด
exports.getParcels = async (req, res) => {
  try {
    const parcels = await Parcels.find().sort({ update_at: -1 });
    res.json(parcels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//แก้ไขข้อมูลพัสดุ
exports.editParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const updatedData = {
      ...req.body,
      update_at: new Date(),
    };
    const updatedParcel = await Parcels.findOneAndUpdate(
      { _id: parcelId },
      updatedData,
      { new: true }
    );
    res.json(updatedParcel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//ลบข้อมูลพัสดุ
exports.deleteParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const deletedParcel = await Parcels.findOneAndDelete({ _id: parcelId });
    res.json(deletedParcel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//ตรวจสอบพื้นที่เกาะ
function checkIsIsland(postcode) {
  return islandData.islands.includes(postcode);
}

// ฟังก์ชันคำนวณค่าส่ง EMS
function calculateEmsCost(weight, isIsland = false, packagingCost = 0) {
  const rate = emsRates.find((r) => weight <= r.max);
  if (!rate) throw new Error("ไม่พบอัตราค่าส่งสำหรับน้ำหนักนี้");

  let cost = rate.price;
  if (isIsland) cost += 15; // พื้นที่เกาะ
  cost += packagingCost; // เพิ่มค่าอุปกรณ์

  return cost;
}

exports.calculateEms = async (req, res) => {
  try {
    const { weight, postcode, packagingCost } = req.body;
    // ตรวจสอบพื้นที่เกาะจากรหัสไปรษณีย์

     if (!/^\d{5}$/.test(postcode)) {
      return res.status(400).json({ success: false, error: "Invalid postcode" });
    }

    const isIsland = checkIsIsland(postcode);
    const totalCost = calculateEmsCost(weight, isIsland, packagingCost);

    res.json({
      success: true,
      weight,
      postcode,
      isIsland,
      packagingCost,
      totalCost,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// equipment
exports.equipment = async (req, res) => {
  try {
    const equipmentPath = path.join(__dirname, "../config/equipmentPrice.json");
    const data = JSON.parse(fs.readFileSync(equipmentPath, "utf-8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "ไม่สามารถอ่านไฟล์อุปกรณ์ได้" });
  }
};

//ฟังก์ชันชำระเงินสด
function calculateCash(total_price, customer_paid) {
  if (!customer_paid || customer_paid < total_price) {
    return {
      success: false,
      message: "จำนวนเงินที่ลูกค้าชำระไม่เพียงพอ",
    };
  }

  const change = customer_paid - total_price;
  return {
    success: true,
    payment_method: "cash",
    total_price,
    customer_paid,
    change,
  };
}

//ฟังก์ชันชำระเงินโอนผ่าน QR Code
async function generateQrPayment(amount) {
  try {
    const accountNumber = process.env.ACCOUNTUMBER;
    const bankCode = process.env.BANK_CODE || "GSB";

    if (!accountNumber) throw new Error("ไม่พบหมายเลขพร้อมเพย์ในไฟล์ .env");

    const payload = generatePayload(accountNumber, { amount });
    // แปลง payload เป็น QR Code (Base64)
    const qrImage = await qrcode.toDataURL(payload);

    return {
      success: true,
      payment_method: "qr",
      bank: bankCode,
      account_number: accountNumber,
      total_price: amount,
      payload,
      qr_image: qrImage,
      status: "waiting_payment",
    };
  } catch (err) {
    console.error("Error generating QR:", err);
    return {
      success: false,
      message: err.message || "ไม่สามารถสร้าง QR Code ได้",
    };
  }
}

//เลือกชำระเงิน
exports.selectPayment = async (req, res) => {
  try {
    const { paymentMethod, total_price, customer_paid } = req.body;

    if (!paymentMethod || !total_price) {
      return res
        .status(400)
        .json({ message: "กรุณาระบุช่องทางชำระเงินและยอดรวม" });
    }

    if (paymentMethod === "cash") {
      const result = calculateCash(total_price, customer_paid);
      return res.json(result);
    }
    if (paymentMethod === "qr") {
      // สร้าง QR Code
      const qr = await generateQrPayment(total_price);
      return res.json(qr);
    }

    res.status(400).json({ message: "ช่องทางชำระเงินไม่ถูกต้อง" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// อัปเดตข้อมูลการชำระเงิน
exports.updatePayment = async (req, res) => {
  try {
    const { total_price, net_price, payment_method, customer_paid } = req.body;

    const latestParcel = await Parcels.findOne().sort({ update_at: -1 });
    if (!latestParcel) {
      return res.status(404).json({ message: "ไม่พบพัสดุในระบบ" });
    }

    const receipt_number =
      "BILL-" + Math.floor(100000 + Math.random() * 900000).toString();

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedParcel = await Parcels.findOneAndUpdate(
      { tracking_number: latestParcel.tracking_number },
      {
        $set: {
          total_price,
          net_price,
          receipt_number,
          customer_paid,
          payment_method,
          payment_status: "ชำระเงินเรียบร้อย",
          update_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedParcel) {
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลพัสดุที่ต้องการอัปเดต" });
    }

    res.status(200).json({
      message: "อัปเดตข้อมูลการชำระเงินสำเร็จ",
      parcel: updatedParcel,
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตการชำระเงิน:", err);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: err.message });
  }
};
