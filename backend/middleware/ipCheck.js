//---Admin เข้าถึงโดเมนด้วย IP เครื่อง
const whitelist = ["127.0.0.1", "::1", "192.168.1.37", "192.168.0.24"];

const ipCheck = (req, res, next) => {
  // ดึง IP เครื่องมาใช้
  let clientIP = req.ip;
  if (clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }
  console.log("Client IP trying to access:", clientIP);
  
  // ตรวจสอบ IP
  const isAdminIP = adminWhitelist.includes(clientIP);
  const isAdminRoute = req.originalUrl.startsWith("/admin");
  const isUserRoute = req.originalUrl.startsWith("/user");

  if (isAdminIP && isAdminRoute) {
    return next();
  }

  // ถ้าเป็น IP แอดมิน แต่พยายามเข้า user → ห้าม
  if (isAdminIP && isUserRoute) {
    return res.status(403).json({
      message: "Forbidden: Admin IP cannot access user pages.",
      yourIP: clientIP,
    });
  }

  // ถ้าไม่ใช่ IP แอดมิน แต่พยายามเข้า admin → ห้าม
  if (!isAdminIP && isAdminRoute) {
    return res.status(403).json({
      message: "Forbidden: You are not allowed to access the admin page.",
      yourIP: clientIP,
    });
  }

  return next();
};

module.exports = ipCheck;
