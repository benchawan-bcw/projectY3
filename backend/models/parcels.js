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
  total_equipment_price: { type: Number, default: 0 },
  service_type: { type: String, default: "EMS" },
  shipping_cost: { type: Number, default: 0 },
  status: { type: String, default: "รออัปเดต" },
  update_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Parcels", ParcelsSchema);