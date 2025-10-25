const Parcels = require("../models/parcels");

exports.getParcels = async (req, res) => {
  try {
    const parcels = await Parcels.find().sort({ update_at: -1 });
    res.json(parcels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getParcelsByTrackingNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const parcel = await Parcels.findOne({ trackingNumber });
    if (!parcel) {
      return res.status(404).json({ message: "ไม่พบข้อมูลพัสดุ" });
    }
    res.json(parcel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};