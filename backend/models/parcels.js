const mongoose = require("mongoose");
const EquipmentSchema = require("./equipment");

const ParcelsSchema = new mongoose.Schema({
  tracking_number: { type: String, required: true, unique: true },

  sender: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },

  receiver: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },

  weight: { type: Number, required: true },
  service_type: { type: String, default: "EMS" },

  equipment: [EquipmentSchema],
  total_equipment: { type: Number, default: 0 },

  shipping_cost: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 },
  net_price: { type: Number, default: 0 },

  receipt_number: { type: String, default: null },

  parcel_status: { type: String, default: "อยู่ที่ร้านรับฝากส่ง" },
  payment_status: { type: String, default: "ยังไม่ชำระเงิน" },
  payment_method: { type: String, default: null },
  customer_paid: { type: Number, default: 0 },

  isLocked: { type: Boolean, default: false },
  lockedBy: { type: String, default: null },
  lockedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

// อัปเดต updatedAt ก่อน save
ParcelsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
// อัปเดต updatedAt เวลาทำ findOneAndUpdate
ParcelsSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model("Parcels", ParcelsSchema);
