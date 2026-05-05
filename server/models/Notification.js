import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: ["vendor", "customer"],
      required: true,
    },
    // For customer notifications, store the email; for vendor, can be null
    audienceKey: { type: String, default: null },
    type: {
      type: String,
      enum: ["Info", "Alert", "Pending", "Success"],
      default: "Info",
    },
    iconName: { type: String, default: "Bell" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
