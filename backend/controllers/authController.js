const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ตรวจสอบชื่อผู้ใช้
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // ตรวจสอบว่าบัญชีถูกปิดการใช้งานไหม (ถ้ามีฟิลด์ isActive)
    if (user.isActive === false) {
      return res.status(403).json({ message: "บัญชีนี้ถูกปิดการใช้งาน" });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, // admin หรือ super_admin
      },
      process.env.JWT_SECRET,
      { expiresIn: "90d" } 
    );

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token: token,
      role: user.role,
      username: user.username,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", error: error.message });
  }
};

export const logout = () => {
  // ลบ token และ role ออกจาก localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("role");
 
  window.location.href = "/SelectRole";
};