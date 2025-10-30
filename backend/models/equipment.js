const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true }
});

module.exports = EquipmentSchema;