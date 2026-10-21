const mongoose = require("mongoose");

// Simple key/value store for app-wide settings (e.g. the redirect URL)
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: "" },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function (key) {
  const doc = await this.findOne({ key }).lean();
  return doc ? doc.value : "";
};

settingSchema.statics.set = async function (key, value) {
  await this.updateOne({ key }, { $set: { value } }, { upsert: true });
  return value;
};

module.exports = mongoose.model("Setting", settingSchema);
