const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authCheck");
const adminController = require("../controllers/adminController"); // <-- import แบบ object เดียว
const checkAutoUnlockParcel = require("../middleware/autoUnlock");

// Dashboard
router.get(
  "/dashboard",
  verifyToken(["admin", "super_admin"]),
  adminController.dashboard
);

// Manage Users
router.get(
  "/manage-users",
  verifyToken(["super_admin"]),
  adminController.getAdmins
);

// Parcel APIs
router.post(
  "/registerParcel",
  verifyToken(["admin", "super_admin"]),
  adminController.registerParcel
);
router.get(
  "/getParcels",
  verifyToken(["admin", "super_admin"]),
  adminController.getParcels
);
router.post(
  "/calculateEms",
  verifyToken(["admin", "super_admin"]),
  adminController.calculateEms
);
router.get(
  "/equipment",
  verifyToken(["admin", "super_admin"]),
  adminController.equipment
);
router.post(
  "/selectPayment",
  verifyToken(["admin", "super_admin"]),
  adminController.selectPayment
);
router.put(
  "/updatePayment",
  verifyToken(["admin", "super_admin"]),
  adminController.updatePayment
);
router.put(
  "/updatePaymentForQrCode",
  verifyToken(["admin", "super_admin"]),
  adminController.updatePaymentForQrCode
);
router.put(
  "/editParcel/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.editParcel
);
router.delete(
  "/deleteParcel/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.deleteParcel
);

// Equipment
router.get(
  "/getEquipment",
  verifyToken(["admin", "super_admin"]),
  adminController.getEquipment
);
router.post(
  "/createEquipment",
  verifyToken(["admin", "super_admin"]),
  adminController.createEquipment
);
router.put(
  "/updateEquipment/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.updateEquipment
);
router.delete(
  "/deleteEquipment/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.deleteEquipment
);

// Admin
router.post(
  "/createAdmin",
  verifyToken(["super_admin"]),
  adminController.createAdmin
);

//admin edit
router.get(
  "/manage-users",
  verifyToken(["super_admin"]),
  adminController.getAdmins
);
router.post(
  "/manage-users",
  verifyToken(["super_admin"]),
  adminController.createAdmin
);
router.put(
  "/manage-users/:id",
  verifyToken(["super_admin"]),
  adminController.updateAdmin
);
router.delete(
  "/manage-users/:id",
  verifyToken(["super_admin"]),
  adminController.deleteAdmin
);

// EMSCost
router.get(
  "/getAllEMSCost",
  verifyToken(["admin", "super_admin"]),
  adminController.getAllEMSCost
);
router.post(
  "/createEMSCost",
  verifyToken(["admin", "super_admin"]),
  adminController.createEMSCost
);
router.put(
  "/updateEMSCost/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.updateEMSCost
);
router.delete(
  "/deleteEMSCost/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.deleteEMSCost
);

// แก้ไขพัสดุของแอดมิน
router.put(
  "/lockParcel/:id",
  verifyToken(["admin", "super_admin"]),
  checkAutoUnlockParcel,
  adminController.lockParcel
);
router.put(
  "/unlockParcel/:id",
  verifyToken(["admin", "super_admin"]),
  checkAutoUnlockParcel,
  adminController.unlockParcel
);

// postcode
router.get(
  "/getAllPostcodes",
  verifyToken(["admin", "super_admin"]),
  adminController.getAllPostcodes
);
router.post(
  "/createPostcode",
  verifyToken(["admin", "super_admin"]),
  adminController.createPostcode
);
router.put(
  "/updatePostcode/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.updatePostcode
);
router.delete(
  "/deletePostcode/:id",
  verifyToken(["admin", "super_admin"]),
  adminController.deletePostcode
);
module.exports = router;
