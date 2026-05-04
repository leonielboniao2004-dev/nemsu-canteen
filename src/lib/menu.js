export const MENU = [
    { id: "m1", name: "Chicken Burger", description: "Crispy fried chicken patty with lettuce & mayo.", price: 75, category: "Meals", emoji: "🍔", available: true },
    { id: "m2", name: "Spaghetti", description: "Filipino-style sweet spaghetti with hotdog.", price: 65, category: "Meals", emoji: "🍝", available: true },
    { id: "m3", name: "Chicken Adobo Rice", description: "Classic adobo over steamed rice.", price: 80, category: "Meals", emoji: "🍱", available: true },
    { id: "m4", name: "Pancit Canton", description: "Stir-fried noodles with veggies.", price: 55, category: "Meals", emoji: "🍜", available: true },
    { id: "s1", name: "French Fries", description: "Golden, crispy, lightly salted.", price: 45, category: "Snacks", emoji: "🍟", available: true },
    { id: "s2", name: "Cheese Sticks (5pc)", description: "Melty cheese in crispy wrapper.", price: 40, category: "Snacks", emoji: "🧀", available: true },
    { id: "s3", name: "Siomai (4pc)", description: "Steamed pork siomai with soy-calamansi.", price: 35, category: "Snacks", emoji: "🥟", available: true },
    { id: "d1", name: "Iced Milo", description: "Cold chocolate malt drink.", price: 30, category: "Drinks", emoji: "🥤", available: true },
    { id: "d2", name: "Bottled Water", description: "500ml mineral water.", price: 20, category: "Drinks", emoji: "💧", available: true },
    { id: "d3", name: "Iced Tea", description: "House-brewed lemon iced tea.", price: 25, category: "Drinks", emoji: "🧋", available: true },
    { id: "des1", name: "Leche Flan", description: "Creamy caramel custard.", price: 35, category: "Desserts", emoji: "🍮", available: true },
    { id: "des2", name: "Chocolate Cookie", description: "Soft-baked chocolate chip.", price: 25, category: "Desserts", emoji: "🍪", available: true },
];
export const peso = (n) => `₱${n.toLocaleString("en-PH")}`;
