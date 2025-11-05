//---Admin เข้าถึงโดเมนด้วย IP เครื่อง
const whitelist = ["::1","127.0.0.1", "192.168.1.37", "192.168.0.24"];

const ipCheck = (req, res, next) => {
  // ดึง IP จริงของผู้ใช้
  let clientIP = req.ip;
  if (clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }
  const isAdminIP = whitelist.includes(clientIP);
  const isAdminRoute = req.originalUrl.startsWith("/admin");
  const isUserRoute = req.originalUrl.startsWith("/user");

  // ✅ ถ้าเป็น IP แอดมิน และเข้าหน้า admin → ผ่านได้
  if (isAdminIP && isAdminRoute) {
    return next();
  }


  // 🚫 ถ้าเป็น IP แอดมิน แต่พยายามเข้า user → ห้าม
  if (isAdminIP && isUserRoute) {
    return res.status(403).json({
      message: "Forbidden",
      yourIP: clientIP,
    });
  }

  // ถ้าไม่ใช่ IP แอดมิน ห้าม
  if (!isAdminIP && isAdminRoute) {
    return res.status(403).json({
      message: "Forbidden",
      yourIP: clientIP,
    });
  }

  return next();
};

module.exports = ipCheck;
