// API ของแอดมิน
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Parcels = require("../models/parcels");
const { getThaiPostToken } = require("../config/memberToken");

// โหลดไฟล์ JSON
const dataPath = path.join(__dirname, "../config/islandsPostCode.json");
const islandData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const emsRatesPath = path.join(__dirname, "../config/emsCost.json");
const emsRates = JSON.parse(fs.readFileSync(emsRatesPath, "utf-8"));

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
      isIsland = false,
      packagingCost = 0,
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
    const totoal_equipment = Array.isArray(equipment)
      ? equipment.reduce((total, item) => total + item.price, 0)
      : equipment.price;

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
      total_equipment: totoal_equipment,
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

// Controller สำหรับ API
exports.calculateEms = (req, res) => {
  try {
    const { weight, postcode, packagingCost } = req.body;
    // ตรวจสอบพื้นที่เกาะจากรหัสไปรษณีย์
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
    res.status(400).json({ success: false, message: error.message });
  }
};

//ดึงข้อมูลที่อยู่จากรหัสไปรษณีย์
exports.getAddressByZipcode = async (req, res) => {
  try {
    const { zipcode } = req.query;
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
      return res.status(400).json({ message: "กรุณากรอกรหัสไปรษณีย์ 5 หลัก" });
    }

    const response = await fetch(
      `https://thaiaddressapi-thaipost.vercel.app/v1/zipcode/${zipcode}`
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ message: "ไม่พบข้อมูลรหัสไปรษณีย์นี้" });
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลรหัสไปรษณีย์นี้" });
    }

    // เลือกตำบลแรก
    const addr = data[0];

    res.status(200).json({
      zipcode: addr.zipcode,
      district: addr.district || "",
      amphoe: addr.amphoe || "",
      province: addr.province || "",
      subdistrict: addr.subdistrict || "",
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};
