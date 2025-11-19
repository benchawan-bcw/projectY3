// API ของแอดมิน
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Parcels = require("../models/parcels");
const { getThaiPostToken } = require("../config/memberToken");
const thaiPostToken = require("../config/memberToken");
const qrcode = require("qrcode");
const generatePayload = require("promptpay-qr");
const { Types } = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

const dotenv = require("dotenv");
const EquipmentSchema = require("../models/equipment");
const Equipment = mongoose.model("Equipment", EquipmentSchema);
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
      sender_name,
      sender_phone,
      receiver_name,
      receiver_phone,
      receiver_address,
      weight,
      equipment,
      service_type,
      postcode,
      isIsland = false,
      packagingCost = 0,
      total_price = 0,
    } = req.body;

    // ตรวจสอบข้อมูลจำเป็น
    if (
      !tracking_number ||
      !receiver_name ||
      !receiver_phone ||
      !receiver_address ||
      !weight
    ) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    // เช็ค Tracking Number ซ้ำ
    const exists = await Parcels.findOne({ tracking_number });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Tracking number already exists" });
    }

    // ดึง token จาก Thailand Post
    let token;
    try {
      token = await thaiPostToken.getThaiPostToken();
    } catch (err) {
      return res
        .status(500)
        .json({ message: "ไม่สามารถดึง token ไปรษณีย์ไทยได้" });
    }

    // ดึงข้อมูล tracking
    let trackingInfo = {};
    try {
      const response = await fetch(
        "https://trackapi.thailandpost.co.th/post/api/v1/track",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "all",
            language: "TH",
            barcode: [tracking_number],
          }),
        }
      );
      const text = await response.text();
      try {
        trackingInfo = JSON.parse(text);
      } catch {
        trackingInfo = {};
      }
    } catch {
      trackingInfo = {};
    }

    // คำนวณค่าจัดส่ง
    const shipping_cost = calculateEmsCost(weight, isIsland, packagingCost);

    const total_equipment = Array.isArray(equipment)
      ? equipment.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
          0
        )
      : 0;

    const net_price = total_price;

    let parcel_status =
      trackingInfo?.status ||
      (Array.isArray(trackingInfo?.items) && trackingInfo.items[0]?.status) ||
      "รออัปเดต";

    if (parcel_status === "รออัปปเดต") parcel_status = "รออัปเดต";

    // สร้างพัสดุ
    const parcel = await Parcels.create({
      tracking_number,
      sender: { name: sender_name, phone: sender_phone },
      receiver: {
        name: receiver_name,
        phone: receiver_phone,
        address: receiver_address,
      },
      weight,
      equipment,
      service_type: service_type || "EMS",
      parcel_status,
      shipping_cost,
      total_equipment,
      total_price,
      net_price,
      updated_at: new Date(),
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
    res.status(500).json({ message: "Server error" });
  }
};

//ลบข้อมูลพัสดุ
exports.deleteParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const deletedParcel = await Parcels.findOneAndDelete({ _id: parcelId });
    res.status(200).json({ message: "ลบข้อมูลพัสดุสําเร็จ", deletedParcel });
  } catch (err) {
    res.status(404).json({ message: "ไม่พบข้อมูลพัสดุ" });
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
      return res
        .status(400)
        .json({ success: false, error: "Invalid postcode" });
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
      const qrResult = await generateQrPayment(total_price);

      if (!qrResult.success) {
        return res.status(500).json({ message: qrResult.message });
      }

      return res.json({
        success: true,
        message: "สร้าง QR ชำระเงินสำเร็จ",
        paymentMethod,
        total_price,
        qrCode: qrResult.qr_image,
      });
    }

    res.status(400).json({ message: "ช่องทางชำระเงินไม่ถูกต้อง" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// อัปเดตข้อมูลการชำระเงิน
exports.updatePaymentForQrCode = async (req, res) => {
  try {
    const { parcels, payment_method, customer_paid, receipt_number } = req.body;

    if (!parcels || parcels.length === 0) {
      return res.status(400).json({ message: "ต้องระบุพัสดุที่จะอัปเดต" });
    }

    // สร้าง bulk operations
    const bulkOps = parcels.map((p) => {
      if (!Types.ObjectId.isValid(p._id)) {
        throw new Error(`_id ของพัสดุไม่ถูกต้อง: ${p._id}`);
      }
      const objectId = new Types.ObjectId(p._id);

      return {
        updateOne: {
          filter: { _id: objectId },
          update: {
            $set: {
              total_price: p.total_price,
              net_price: p.total_price,
              payment_method,
              customer_paid,
              receipt_number,
              payment_status: "ชำระเงินเรียบร้อย",
              update_at: new Date(),
            },
          },
        },
      };
    });

    const result = await Parcels.bulkWrite(bulkOps);

    const modifiedCount = result.modifiedCount || 0; // ป้องกัน undefined

    if (modifiedCount === 0) {
      return res.status(404).json({
        message: "ไม่พบพัสดุที่ต้องการอัปเดต",
        modifiedCount,
      });
    }

    res.status(200).json({
      message: `อัปเดตข้อมูลการชำระเงินเรียบร้อย ${modifiedCount} พัสดุ`,
      modifiedCount,
      qr_image:
        req.body.qr_image || req.body.qrCode || "url_qr_image_placeholder",
    });
  } catch (err) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      error: err.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { parcels, net_price, payment_method, customer_paid } = req.body;

    if (!parcels || parcels.length === 0) {
      return res.status(400).json({ message: "ต้องระบุพัสดุที่จะอัปเดต" });
    }

    const receipt_number =
      "BILL-" + Math.floor(100000 + Math.random() * 900000).toString();

    const bulkOps = parcels.map((p) => {
      if (!Types.ObjectId.isValid(p._id)) {
        throw new Error(`_id ของพัสดุไม่ถูกต้อง: ${p._id}`);
      }
      const objectId = new Types.ObjectId(p._id);

      return {
        updateOne: {
          filter: { _id: objectId },
          update: {
            $set: {
              total_price: p.total_price, // ราคาของแต่ละพัสดุ
              net_price,
              receipt_number,
              customer_paid:
                payment_method === "cash" ? customer_paid : p.total_price,
              payment_method,
              payment_status: "ชำระเงินเรียบร้อย",
              update_at: new Date(),
            },
          },
        },
      };
    });

    const result = await Parcels.bulkWrite(bulkOps);

    const modifiedCount = result.modifiedCount || 0; // ป้องกัน undefined

    if (modifiedCount === 0) {
      return res.status(404).json({
        message: "ไม่พบพัสดุที่ต้องการอัปเดต",
        modifiedCount,
      });
    }

    res.status(200).json({
      message: `อัปเดตข้อมูลการชำระเงินเรียบร้อย ${result.modifiedCount} พัสดุ`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: err.message });
  }
};

//เช็กข้อมูลตามวัน
function getDayRangeBangkok(dateStr) {
  const tz = "+07:00";
  const d = dateStr ? dateStr : new Date().toISOString().slice(0, 10);
  const start = new Date(`${d}T00:00:00${tz}`);
  const end = new Date(`${d}T23:59:59.999${tz}`);
  return { start, end };
}

// ดึงข้อมูลอุปกร
exports.getEquipment = async (req, res) => {
  try {
    const equipments = await Equipment.find();
    res.json(equipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// เพิ่มอุปกรใหม่
exports.createEquipment = async (req, res) => {
  try {
    const { name, price, quantity } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "ต้องระบุชื่อและราคา" });
    }

    const newEquipment = new Equipment({
      name,
      price,
      quantity: quantity || 1,
    });

    const saved = await newEquipment.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// แก้ไขอุปกรณ์
exports.updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity } = req.body;

    const updated = await Equipment.findByIdAndUpdate(
      id,
      { name, price, quantity },
      { new: true } // คืนค่าเอกสารที่อัปเดตแล้ว
    );

    if (!updated) {
      return res.status(404).json({ message: "ไม่พบอุปกรณ์นี้" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ลบอุปกร
exports.deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Equipment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "ไม่พบอุปกรณ์นี้" });
    }

    res.json({ message: "ลบอุปกรณ์เรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dashboard = (req, res) => {
  res.json({ message: "Admin Dashboard" });
};

exports.manageUsers = (req, res) => {
  res.json({ message: "Manage Users" });
};

// เพิ่ม admin
exports.createAdmin = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    if (!["admin", "super_admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "role ต้องเป็น admin หรือ super_admin" });
    }

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(400).json({ message: "ชื่อผู้ใช้นี้มีอยู่แล้ว" });

    const newUser = new User({ username, password, role });
    await newUser.save();

    res.json({ message: "สร้างผู้ใช้งานเรียบร้อย", user: { username, role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// แก้ไข admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    if (username) user.username = username;
    if (role && ["admin", "super_admin"].includes(role)) user.role = role;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    res.json({
      message: "อัปเดตผู้ใช้งานเรียบร้อย",
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ดึงรายชื่อ admin
exports.getAdmins = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["admin", "super_admin"] },
    }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ลบ admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
