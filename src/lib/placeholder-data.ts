

// This file now only contains data that is not fetched from Firestore.

export const categories = [
    "Fresh Produce",
    "Bakery",
    "Dairy & Eggs",
    "Meat & Seafood",
    "Pantry",
    "Frozen Foods",
    "Beverages",
    "Snacks",
    "Household",
    "Health & Beauty",
    "Baby & Toddler",
    "Pets",
    "Deli & Prepared Foods",
    "Canned Goods",
    "Baking Supplies",
    "Condiments & Sauces",
    "Cereal & Breakfast",
    "Organic",
    "International",
    "Wine & Beer",
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Toys & Games",
    "Books & Magazines"
  ];

export const sampleProducts = [
    // Fresh Produce
  { id: "prod_001", name: "Organic Apples", category: "Fresh Produce", price: 2.99, stock: { "front-of-house": 50, "back-of-house": 150 }, imageUrl: "https://picsum.photos/400/400?random=1", aiHint: "organic apples", barcode: "P-FP-001" },
  { id: "prod_021", name: "Avocado", category: "Fresh Produce", price: 1.99, stock: { "front-of-house": 80, "back-of-house": 200 }, imageUrl: "https://picsum.photos/400/400?random=21", aiHint: "avocado fruit", barcode: "P-FP-002" },
  { id: "prod_026", name: "Bananas", category: "Fresh Produce", price: 0.59, stock: { "front-of-house": 120, "back-of-house": 300 }, imageUrl: "https://picsum.photos/400/400?random=26", aiHint: "bananas bunch", barcode: "P-FP-003" },
  { id: "prod_027", name: "Strawberries (1lb)", category: "Fresh Produce", price: 4.50, stock: { "front-of-house": 40, "back-of-house": 80 }, imageUrl: "https://picsum.photos/400/400?random=27", aiHint: "fresh strawberries", barcode: "P-FP-004" },
  { id: "prod_028", name: "Romaine Lettuce", category: "Fresh Produce", price: 2.49, stock: { "front-of-house": 60, "back-of-house": 100 }, imageUrl: "https://picsum.photos/400/400?random=28", aiHint: "romaine lettuce", barcode: "P-FP-005" },

  // Bakery
  { id: "prod_002", name: "Sourdough Bread", category: "Bakery", price: 5.49, stock: { "front-of-house": 25, "back-of-house": 75 }, imageUrl: "https://picsum.photos/400/400?random=2", aiHint: "sourdough bread", barcode: "P-BK-001" },
  { id: "prod_029", name: "Croissants (Pack of 4)", category: "Bakery", price: 6.99, stock: { "front-of-house": 30, "back-of-house": 60 }, imageUrl: "https://picsum.photos/400/400?random=29", aiHint: "fresh croissants", barcode: "P-BK-002" },
  { id: "prod_030", name: "Blueberry Muffins", category: "Bakery", price: 3.99, stock: { "front-of-house": 40, "back-of-house": 90 }, imageUrl: "https://picsum.photos/400/400?random=30", aiHint: "blueberry muffins", barcode: "P-BK-003" },

  // Dairy & Eggs
  { id: "prod_003", name: "Free-Range Eggs", category: "Dairy & Eggs", price: 4.99, stock: { "front-of-house": 60, "back-of-house": 120 }, imageUrl: "https://picsum.photos/400/400?random=3", aiHint: "free-range eggs", barcode: "P-DE-001" },
  { id: "prod_022", name: "Whole Milk", category: "Dairy & Eggs", price: 3.50, stock: { "front-of-house": 100, "back-of-house": 150 }, imageUrl: "https://picsum.photos/400/400?random=22", aiHint: "milk carton", barcode: "P-DE-002" },
  { id: "prod_025", name: "Greek Yogurt", category: "Dairy & Eggs", price: 5.49, stock: { "front-of-house": 70, "back-of-house": 130 }, imageUrl: "https://picsum.photos/400/400?random=25", aiHint: "greek yogurt", barcode: "P-DE-003" },
  { id: "prod_031", name: "Cheddar Cheese Block", category: "Dairy & Eggs", price: 8.99, stock: { "front-of-house": 50, "back-of-house": 100 }, imageUrl: "https://picsum.photos/400/400?random=31", aiHint: "cheddar cheese", barcode: "P-DE-004" },

  // Meat & Seafood
  { id: "prod_004", name: "Ground Beef", category: "Meat & Seafood", price: 7.99, stock: { "front-of-house": 30, "back-of-house": 90 }, imageUrl: "https://picsum.photos/400/400?random=4", aiHint: "ground beef", barcode: "P-MS-001" },
  { id: "prod_023", name: "Wild Salmon", category: "Meat & Seafood", price: 14.99, stock: { "front-of-house": 15, "back-of-house": 30 }, imageUrl: "https://picsum.photos/400/400?random=23", aiHint: "salmon fillet", barcode: "P-MS-002" },
  { id: "prod_032", name: "Chicken Breast", category: "Meat & Seafood", price: 9.99, stock: { "front-of-house": 40, "back-of-house": 120 }, imageUrl: "https://picsum.photos/400/400?random=32", aiHint: "chicken breast", barcode: "P-MS-003" },

  // Pantry
  { id: "prod_005", name: "Quinoa", category: "Pantry", price: 6.25, stock: { "front-of-house": 40, "back-of-house": 100 }, imageUrl: "https://picsum.photos/400/400?random=5", aiHint: "quinoa grains", barcode: "P-PA-001" },
  { id: "prod_024", name: "Almond Butter", category: "Pantry", price: 9.99, stock: { "front-of-house": 30, "back-of-house": 70 }, imageUrl: "https://picsum.photos/400/400?random=24", aiHint: "almond butter", barcode: "P-PA-002" },
  { id: "prod_033", name: "Olive Oil", category: "Pantry", price: 12.49, stock: { "front-of-house": 50, "back-of-house": 90 }, imageUrl: "https://picsum.photos/400/400?random=33", aiHint: "olive oil", barcode: "P-PA-003" },
  { id: "prod_034", name: "Pasta (Spaghetti)", category: "Pantry", price: 2.29, stock: { "front-of-house": 100, "back-of-house": 250 }, imageUrl: "https://picsum.photos/400/400?random=34", aiHint: "spaghetti pasta", barcode: "P-PA-004" },
  
  // Frozen Foods
  { id: "prod_006", name: "Frozen Pizza", category: "Frozen Foods", price: 8.99, stock: { "front-of-house": 35, "back-of-house": 80 }, imageUrl: "https://picsum.photos/400/400?random=6", aiHint: "frozen pizza", barcode: "P-FF-001" },
  { id: "prod_035", name: "Frozen Berries Mix", category: "Frozen Foods", price: 7.99, stock: { "front-of-house": 40, "back-of-house": 100 }, imageUrl: "https://picsum.photos/400/400?random=35", aiHint: "frozen berries", barcode: "P-FF-002" },

  // Beverages
  { id: "prod_007", name: "Kombucha", category: "Beverages", price: 3.99, stock: { "front-of-house": 70, "back-of-house": 200 }, imageUrl: "https://picsum.photos/400/400?random=7", aiHint: "kombucha drink", barcode: "P-BV-001" },
  { id: "prod_036", name: "Sparkling Water", category: "Beverages", price: 1.99, stock: { "front-of-house": 150, "back-of-house": 400 }, imageUrl: "https://picsum.photos/400/400?random=36", aiHint: "sparkling water", barcode: "P-BV-002" },

  // Snacks
  { id: "prod_008", name: "Potato Chips", category: "Snacks", price: 2.50, stock: { "front-of-house": 100, "back-of-house": 300 }, imageUrl: "https://picsum.photos/400/400?random=8", aiHint: "potato chips", barcode: "P-SN-001" },
  { id: "prod_037", name: "Trail Mix", category: "Snacks", price: 6.49, stock: { "front-of-house": 60, "back-of-house": 120 }, imageUrl: "https://picsum.photos/400/400?random=37", aiHint: "trail mix", barcode: "P-SN-002" },

  // Household
  { id: "prod_009", name: "Paper Towels", category: "Household", price: 12.99, stock: { "front-of-house": 40, "back-of-house": 60 }, imageUrl: "https://picsum.photos/400/400?random=9", aiHint: "paper towels", barcode: "P-HH-001" },
  { id: "prod_038", name: "Dish Soap", category: "Household", price: 4.29, stock: { "front-of-house": 80, "back-of-house": 150 }, imageUrl: "https://picsum.photos/400/400?random=38", aiHint: "dish soap", barcode: "P-HH-002" },

  // Health & Beauty
  { id: "prod_010", name: "Shampoo", category: "Health & Beauty", price: 7.50, stock: { "front-of-house": 50, "back-of-house": 100 }, imageUrl: "https://picsum.photos/400/400?random=10", aiHint: "shampoo bottle", barcode: "P-HB-001" },
  { id: "prod_039", name: "Toothpaste", category: "Health & Beauty", price: 3.49, stock: { "front-of-house": 100, "back-of-house": 200 }, imageUrl: "https://picsum.photos/400/400?random=39", aiHint: "toothpaste tube", barcode: "P-HB-002" },

  // Baby & Toddler
  { id: "prod_011", name: "Baby Diapers", category: "Baby & Toddler", price: 24.99, stock: { "front-of-house": 20, "back-of-house": 50 }, imageUrl: "https://picsum.photos/400/400?random=11", aiHint: "baby diapers", barcode: "P-BT-001" },

  // Pets
  { id: "prod_012", name: "Dry Dog Food", category: "Pets", price: 35.00, stock: { "front-of-house": 15, "back-of-house": 40 }, imageUrl: "https://picsum.photos/400/400?random=12", aiHint: "dog food", barcode: "P-PE-001" },

  // Deli & Prepared Foods
  { id: "prod_013", name: "Rotisserie Chicken", category: "Deli & Prepared Foods", price: 9.99, stock: { "front-of-house": 20, "back-of-house": 10 }, imageUrl: "https://picsum.photos/400/400?random=13", aiHint: "rotisserie chicken", barcode: "P-DP-001" },

  // Canned Goods
  { id: "prod_014", name: "Canned Tomatoes", category: "Canned Goods", price: 1.50, stock: { "front-of-house": 120, "back-of-house": 400 }, imageUrl: "https://picsum.photos/400/400?random=14", aiHint: "canned tomatoes", barcode: "P-CG-001" },

  // Baking Supplies
  { id: "prod_015", name: "All-Purpose Flour", category: "Baking Supplies", price: 4.00, stock: { "front-of-house": 80, "back-of-house": 200 }, imageUrl: "https://picsum.photos/400/400?random=15", aiHint: "flour bag", barcode: "P-BS-001" },

  // Condiments & Sauces
  { id: "prod_016", name: "Ketchup", category: "Condiments & Sauces", price: 3.29, stock: { "front-of-house": 90, "back-of-house": 250 }, imageUrl: "https://picsum.photos/400/400?random=16", aiHint: "ketchup bottle", barcode: "P-CS-001" },

  // Cereal & Breakfast
  { id: "prod_017", name: "Oat Cereal", category: "Cereal & Breakfast", price: 4.79, stock: { "front-of-house": 75, "back-of-house": 150 }, imageUrl: "https://picsum.photos/400/400?random=17", aiHint: "cereal box", barcode: "P-CB-001" },

  // Organic
  { id: "prod_018", name: "Organic Spinach", category: "Organic", price: 3.99, stock: { "front-of-house": 45, "back-of-house": 80 }, imageUrl: "https://picsum.photos/400/400?random=18", aiHint: "organic spinach", barcode: "P-OR-001" },

  // International
  { id: "prod_019", name: "Soy Sauce", category: "International", price: 2.99, stock: { "front-of-house": 60, "back-of-house": 140 }, imageUrl: "https://picsum.photos/400/400?random=19", aiHint: "soy sauce", barcode: "P-IN-001" },

  // Wine & Beer
  { id: "prod_020", name: "Cabernet Sauvignon", category: "Wine & Beer", price: 15.99, stock: { "front-of-house": 25, "back-of-house": 60 }, imageUrl: "https://picsum.photos/400/400?random=20", aiHint: "wine bottle", barcode: "P-WB-001" }
];
