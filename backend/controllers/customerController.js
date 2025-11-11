const Parcels = require("../models/parcels");
const fs = require("fs");
const path = require("path");

exports.getParcels = async (req, res) => {
  try {
    const parcels = await Parcels.find().sort({ update_at: -1 });
    res.json(parcels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getParcelsByTrackingNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const parcel = await Parcels.findOne({ trackingNumber });
    if (!parcel) {
      return res.status(404).json({ message: "ไม่พบข้อมูลพัสดุ" });
    }
    res.json(parcel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTrackByTrackingNumber = async (req, res) => {
  const { trackingNumber } = req.params;
  // console.log("📦 เริ่มดึงข้อมูลพัสดุ:", req.params.trackingNumber);
  require("dotenv").config();
  const apiKey = process.env.THAIPOST_MEMBER_TOKEN;

  if (!apiKey) {
    console.error("❌ ไม่พบ Token ใน .env");
    return res.status(500).json({ message: "API key not found" });
  }

  try {
    // ขอ Token
    const tokenRes = await fetch(
      "https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + apiKey,
        },
      }
    );
    const { token } = await tokenRes.json();
    // console.log("🔍 Thai Post API token:", token);

    // ใช้ Token ไปเรียก Tracking
    const trackRes = await fetch(
      "https://trackapi.thailandpost.co.th/post/api/v1/track",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + token,
        },
        body: JSON.stringify({
          status: "all",
          language: "TH",
          barcode: [trackingNumber],
        }),
      }
    );

    const data = await trackRes.json();
    
    const item = data.response?.items?.[trackingNumber];
    if (!item) {
      return res
        .status(404)
        .json({ message: `Tracking number ${trackingNumber} not found` });
    }

    res.json(item);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getShippingRate = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../config/emsCost.json");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "ไม่พบไฟล์ emsCost.json" });
    }

    const jsonData = fs.readFileSync(filePath, "utf8");
    const rates = JSON.parse(jsonData);

    res.json(rates);
  } catch (error) {
    console.error("Error reading shippingRates.json:", error);
    res.status(500).json({ message: "ไม่สามารถอ่านไฟล์ข้อมูลได้" });
  }
};
