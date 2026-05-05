import mongoose from "mongoose";

const orderLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    emoji: String,
    price: Number,
    qty: { type: Number, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, lowercase: true },
    studentName: { type: String, required: true },
    studentId: { type: String, default: "" },
    studentRole: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },
    lines: [orderLineSchema],
    total: { type: Number, required: true },
    pickupTime: { type: String, default: "ASAP" },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Friendly short ID helper
orderSchema.virtual("shortId").get(function () {
  return "ORD-" + this._id.toString().slice(-6).toUpperCase();
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export default mongoose.model("Order", orderSchema);
