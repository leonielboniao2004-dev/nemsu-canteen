import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: "🍽️" },
    category: {
      type: String,
      enum: ["Meals", "Snacks", "Drinks", "Desserts"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 10, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    description: { type: String, default: "" },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: isLowStock
productSchema.virtual("isLowStock").get(function () {
  return this.stock < this.lowStockThreshold;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
