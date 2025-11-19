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

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware อัปเดตวันที่แก้ไขล่าสุด
ParcelsSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Parcels", ParcelsSchema);
