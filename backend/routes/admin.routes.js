const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authCheck");
const adminController = require("../controllers/adminController"); // <-- import แบบ object เดียว

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
  adminController.manageUsers
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

router.post(
  "/createAdmin",
  verifyToken(["super_admin"]),
  adminController.createAdmin
);

router.get(
  "/getAdmins",
  verifyToken(["super_admin"]),
  adminController.getAdmins
);

router.delete(
  "/deleteAdmin/:id",
  verifyToken(["super_admin"]),
  adminController.deleteAdmin
);

router.put(
  "/updateAdmin",
  verifyToken(["super_admin"]),
  adminController.updateAdmin
);

module.exports = router;
