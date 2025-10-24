const express = require("express");
const basicAuth = require("express-basic-auth");
const cors = require("cors");
const fetch = require("node-fetch");

const connectDB = require("./db");
const { getThaiPostToken } = require("./config/memberToken");
const Parcels = require("../models/parcels");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

connectDB();

//------Domain------

//---Admin เข้าถึงโดเมนด้วย IP เครื่อง
const whitelist = ["192.168.1.37", "192.168.0.24"];
const ipCheck = (req, res, next) => {
  let clientIP = req.ip;
  if (clientIP.startsWith("::ffff:"))
    clientIP = clientIP.replace("::ffff:", "");
  if (whitelist.includes(req.ip)) {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
};
//---Basic Auth
const auth = basicAuth({
  users: {
    admin: "bands",
  },
  challenge: true,
});
app.use(ipCheck);
app.use(auth);

//------API------

//---ลงทะเบียนพัสดุ
app.post("/api/parcels", async (req, res) => {
  const { tracking_number, sender, receiver, address, weight, service_type } =
    req.body;
  // ตรวจสอบว่ามีพัสดุอยู่แล้วหรือไม่
  const exists = await Parcels.findOne({ tracking_number });
  if (exists) {
    return res.status(400).json({ message: "Tracking number already exists" });
  }
  // ดึง token จาก ไปรษณีย์ไทย
  const token = await getThaiPostToken();
  // เรียกใช้ web service ไปรษณีย์ไทย
  const response = await fetch(
    "https://trackapi.thailandpost.co.th/post/api/v1/track",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ barcode: tracking_number }),
    }
  );

  const trackingInfo = await response.json();
  console.log(trackingInfo);

  const parcel = await Parcels.create({
    tracking_number,
    sender,
    receiver,
    address,
    weight,
    service_type: service_type || "EMS",
    status: trackingInfo.status || "", // อัปเดตจาก Web Service
    update_at: new Date(),
  });
  res.status(201).json({ message: "ลงทะเบียนพัสดุสำเร็จ", parcel });
});

//---ดึงข้อมูลพัสดุ
app.get("/api/parcels", async (req, res) => {
  try {
    const parcels = await Parcels.find().sort({ update_at: -1 });
    res.json(parcels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//--คำนวณค่าส่ง EMS

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
