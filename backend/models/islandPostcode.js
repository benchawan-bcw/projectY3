const mongoose = require("mongoose");

const IslandsPostCodeSchema = new mongoose.Schema({
  postcode: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("IslandsPostCode", IslandsPostCodeSchema);
