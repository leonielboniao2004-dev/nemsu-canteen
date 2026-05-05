/**
 * Seed script — run once to populate MongoDB with initial products and vendor account.
 * Usage: node server/seed.js
 */
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import Product from "./models/Product.js";
import User from "./models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PRODUCTS = [
  { name: "Chicken Burger", description: "Crispy fried chicken patty with lettuce & mayo.", price: 75, category: "Meals", emoji: "🍔", stock: 20 },
  { name: "Spaghetti", description: "Filipino-style sweet spaghetti with hotdog.", price: 65, category: "Meals", emoji: "🍝", stock: 15 },
  { name: "Chicken Adobo Rice", description: "Classic adobo over steamed rice.", price: 80, category: "Meals", emoji: "🍱", stock: 18 },
  { name: "Pancit Canton", description: "Stir-fried noodles with veggies.", price: 55, category: "Meals", emoji: "🍜", stock: 12 },
  { name: "French Fries", description: "Golden, crispy, lightly salted.", price: 45, category: "Snacks", emoji: "🍟", stock: 30 },
  { name: "Cheese Sticks (5pc)", description: "Melty cheese in crispy wrapper.", price: 40, category: "Snacks", emoji: "🧀", stock: 25 },
  { name: "Siomai (4pc)", description: "Steamed pork siomai with soy-calamansi.", price: 35, category: "Snacks", emoji: "🥟", stock: 4 },
  { name: "Iced Milo", description: "Cold chocolate malt drink.", price: 30, category: "Drinks", emoji: "🥤", stock: 40 },
  { name: "Bottled Water", description: "500ml mineral water.", price: 20, category: "Drinks", emoji: "💧", stock: 50 },
  { name: "Iced Tea", description: "House-brewed lemon iced tea.", price: 25, category: "Drinks", emoji: "🧋", stock: 35 },
  { name: "Leche Flan", description: "Creamy caramel custard.", price: 35, category: "Desserts", emoji: "🍮", stock: 10 },
  { name: "Chocolate Cookie", description: "Soft-baked chocolate chip.", price: 25, category: "Desserts", emoji: "🍪", stock: 20 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Seed products (skip if already exist)
    const existing = await Product.countDocuments();
    if (existing === 0) {
      await Product.insertMany(PRODUCTS);
      console.log(`✅ Seeded ${PRODUCTS.length} products`);
    } else {
      console.log(`ℹ️  Products already seeded (${existing} found) — skipping`);
    }

    // Seed vendor account
    const vendor = await User.findOne({ role: "vendor" });
    if (!vendor) {
      await User.create({
        name: "Canteen Vendor",
        email: "vendor@canteen.local",
        password: "vendor123",
        role: "vendor",
      });
      console.log("✅ Vendor account created (vendor@canteen.local / vendor123)");
    } else {
      console.log("ℹ️  Vendor account already exists — skipping");
    }

    console.log("\n🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
