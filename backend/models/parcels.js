const mongoose = require("mongoose");
const EquipmentSchema = require("./equipment");

const ParcelsSchema = new mongoose.Schema({
  tracking_number: { type: String, required: true },
  sender: { type: String, required: true },
  sender_phone: { type: String, required: true },
  receiver: { type: String, required: true },
  receiver_phone: { type: String, required: true },
  address: { type: String, required: true },
  weight: { type: Number, required: true },
  equipment: [EquipmentSchema],
  total_equipment: { type: Number, default: 0 },
  service_type: { type: String, default: "EMS" },
  shipping_cost: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 }, //รวมค่าส่ง + อุปกรณ์
  net_price: { type: Number, default: 0 }, //ราคาสุทธิ (ใช้พิมพ์ใบเสร็จ)
  receipt_number: { type: String, default: null }, // หมายเลขใบเสร็จ
  parcel_status: { type: String, default: "อยู่ที่ร้านรับฝากส่ง" },
  payment_status: { type: String, default: "ยังไม่ชําระเงิน" },
  payment_method: { type: String, default: null },
  update_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Parcels", ParcelsSchema);
