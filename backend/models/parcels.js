const mongoose = require("mongoose");

const ParcelsSchema = new mongoose.Schema({
  tracking_number: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  address: { type: String, required: true },
  weight: { type: Number, required: true },
  service_type: { type: String, default: "EMS" },
  status: { type: String, default: "รออัปเดต" },
  update_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Parcels", ParcelsSchema);