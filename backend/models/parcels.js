const mongoose = require("mongoose");

const ParcelsSchema = new mongoose.Schema({
    tracking_number: String,
    sender: String,
    receiver: String,
    address: String,
    weight: String,
    service_type: String,
    status: String,
    update_at: Date
});

module.exports = mongoose.model("Parcels", ParcelsSchema);