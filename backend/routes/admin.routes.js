const express = require("express");
const router = express.Router();

const ipCheck = require("../middleware/ipCheck");
const adminAuth = require("../middleware/basicAuth");

const {
  registerParcel,
  getParcels,
  calculateEms,
} = require("../controllers/adminController");

//middleware
router.use(ipCheck);
router.use(adminAuth);

//API
router.post("/registerParcel", registerParcel);
router.get("/getParcels", getParcels);
router.post("/calculateEms", calculateEms);

module.exports = router;
