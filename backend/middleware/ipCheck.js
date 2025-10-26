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
  if (whitelist.includes(clientIP)) {
    next();
  } else {
    res.status(403).json({
      message: "Forbidden: Your IP is not allowed to access this domain.",
      yourIP: clientIP,
    });
  }
};

module.exports = ipCheck;
