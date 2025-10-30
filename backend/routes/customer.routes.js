const express = require("express");
const router = express.Router();
const connectDB = require("../config/db");

const {
  getParcels,
  getParcelsByTrackingNumber,
  getTrackByTrackingNumber,
} = require("../controllers/customerController");

connectDB();

router.get("/parcels", getParcels);
router.get("/parcels/:trackingNumber", getParcelsByTrackingNumber);
router.get("/track/:trackingNumber", getTrackByTrackingNumber);

module.exports = router;
