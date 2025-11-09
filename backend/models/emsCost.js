const mongoose = require("mongoose");

const EMSCostSchema = new mongoose.Schema({
  max: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("EMSCost", EMSCostSchema);
