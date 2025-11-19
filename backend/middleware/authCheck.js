const jwt = require("jsonwebtoken");

exports.verifyToken = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "ไม่ได้รับอนุญาต" });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token ไม่ถูกต้อง" });
    }
  };
};
