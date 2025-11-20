const Parcels = require("../models/parcels");

const AUTO_UNLOCK_TIME = 10 * 60 * 1000; // 10 นาที

const checkAutoUnlockParcel = async (req, res, next) => {
  if (!req.params.id) return next();

  const parcel = await Parcels.findById(req.params.id);
  if (parcel.lockedAt) {
    const diff = Date.now() - new Date(parcel.lockedAt).getTime();
    if (diff > AUTO_UNLOCK_TIME) {
      parcel.isLocked = false;
      parcel.lockedBy = null;
      parcel.lockedAt = null;
      await parcel.save();
    }
  }
  next();
};

module.exports = checkAutoUnlockParcel;
