const mongoose = require("mongoose");

const portalSchema = new mongoose.Schema({
  portalName: {
    type: String,
    required: true,
    unique: true,
  },

  isDeleted: {
    default: false,
    type: Boolean,
  },
});

const Portal = mongoose.model("Portal", portalSchema);

module.exports = Portal;
