const MarketPrice = require("../models/MarketPrice");

const sampleMarketPrices = [
    // Wheat Markets - Current
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Ludhiana Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Gill Road, Ludhiana",
        minPrice: 2400,
        modalPrice: 2450,
        maxPrice: 2520,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Khanna Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "GT Road, Khanna",
        minPrice: 2420,
        modalPrice: 2510,
        maxPrice: 2580,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Jagraon Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Mandi Board Yard, Jagraon",
        minPrice: 2380,
        modalPrice: 2430,
        maxPrice: 2500,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Amritsar Grain Market",
        state: "Punjab",
        district: "Amritsar",
        marketLocation: "Bhagtanwala, Amritsar",
        minPrice: 2410,
        modalPrice: 2475,
        maxPrice: 2540,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Karnal Grain Mandi",
        state: "Haryana",
        district: "Karnal",
        marketLocation: "New Grain Market, Karnal",
        minPrice: 2430,
        modalPrice: 2490,
        maxPrice: 2560,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },

    // Rice Markets - Current
    {
        cropName: "Rice",
        cropType: "Food Grain",
        marketName: "Ludhiana Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Gill Road, Ludhiana",
        minPrice: 3300,
        modalPrice: 3450,
        maxPrice: 3600,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Rice",
        cropType: "Food Grain",
        marketName: "Karnal Grain Mandi",
        state: "Haryana",
        district: "Karnal",
        marketLocation: "New Grain Market, Karnal",
        minPrice: 3400,
        modalPrice: 3550,
        maxPrice: 3700,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Rice",
        cropType: "Food Grain",
        marketName: "Patiala Grain Mandi",
        state: "Punjab",
        district: "Patiala",
        marketLocation: "Sirhind Road, Patiala",
        minPrice: 3250,
        modalPrice: 3380,
        maxPrice: 3520,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },

    // Maize Markets - Current
    {
        cropName: "Maize",
        cropType: "Coarse Grain",
        marketName: "Jagraon Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Mandi Board Yard, Jagraon",
        minPrice: 2050,
        modalPrice: 2150,
        maxPrice: 2220,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Maize",
        cropType: "Coarse Grain",
        marketName: "Hoshiarpur Mandi",
        state: "Punjab",
        district: "Hoshiarpur",
        marketLocation: "Main Yard, Hoshiarpur",
        minPrice: 2080,
        modalPrice: 2180,
        maxPrice: 2260,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },

    // Cotton Markets - Current
    {
        cropName: "Cotton",
        cropType: "Cash Crop",
        marketName: "Bhatinda Cotton Market",
        state: "Punjab",
        district: "Bhatinda",
        marketLocation: "Mansa Road, Bhatinda",
        minPrice: 6800,
        modalPrice: 7100,
        maxPrice: 7350,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Cotton",
        cropType: "Cash Crop",
        marketName: "Sirsa Grain & Cotton Mandi",
        state: "Haryana",
        district: "Sirsa",
        marketLocation: "Hisar Road, Sirsa",
        minPrice: 6900,
        modalPrice: 7180,
        maxPrice: 7400,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },

    // Mustard Markets - Current
    {
        cropName: "Mustard",
        cropType: "Oilseed",
        marketName: "Sirsa Grain & Cotton Mandi",
        state: "Haryana",
        district: "Sirsa",
        marketLocation: "Hisar Road, Sirsa",
        minPrice: 5350,
        modalPrice: 5500,
        maxPrice: 5650,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Mustard",
        cropType: "Oilseed",
        marketName: "Bathinda Mandi",
        state: "Punjab",
        district: "Bhatinda",
        marketLocation: "Mansa Road, Bathinda",
        minPrice: 5300,
        modalPrice: 5460,
        maxPrice: 5600,
        unit: "quintal",
        priceDate: new Date("2026-09-26"),
        source: "Sample Market Data (Agmarknet simulation)"
    },

    // Historical records for Wheat in Ludhiana Mandi for trend display
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Ludhiana Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Gill Road, Ludhiana",
        minPrice: 2350,
        modalPrice: 2400,
        maxPrice: 2460,
        unit: "quintal",
        priceDate: new Date("2026-09-15"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Ludhiana Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Gill Road, Ludhiana",
        minPrice: 2370,
        modalPrice: 2420,
        maxPrice: 2480,
        unit: "quintal",
        priceDate: new Date("2026-09-18"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Wheat",
        cropType: "Food Grain",
        marketName: "Ludhiana Mandi",
        state: "Punjab",
        district: "Ludhiana",
        marketLocation: "Gill Road, Ludhiana",
        minPrice: 2390,
        modalPrice: 2435,
        maxPrice: 2500,
        unit: "quintal",
        priceDate: new Date("2026-09-22"),
        source: "Sample Market Data (Agmarknet simulation)"
    },

    // Historical records for Rice in Karnal Mandi
    {
        cropName: "Rice",
        cropType: "Food Grain",
        marketName: "Karnal Grain Mandi",
        state: "Haryana",
        district: "Karnal",
        marketLocation: "New Grain Market, Karnal",
        minPrice: 3350,
        modalPrice: 3480,
        maxPrice: 3620,
        unit: "quintal",
        priceDate: new Date("2026-09-18"),
        source: "Sample Market Data (Agmarknet simulation)"
    },
    {
        cropName: "Rice",
        cropType: "Food Grain",
        marketName: "Karnal Grain Mandi",
        state: "Haryana",
        district: "Karnal",
        marketLocation: "New Grain Market, Karnal",
        minPrice: 3380,
        modalPrice: 3510,
        maxPrice: 3660,
        unit: "quintal",
        priceDate: new Date("2026-09-22"),
        source: "Sample Market Data (Agmarknet simulation)"
    }
];

const seedMarketPrices = async () => {
    try {
        const count = await MarketPrice.countDocuments();
        if (count === 0) {
            await MarketPrice.insertMany(sampleMarketPrices);
            console.log("🌱 Seeded 18 sample market price records successfully.");
        } else {
            console.log(`ℹ️ MarketPrice collection already contains ${count} records.`);
        }
    } catch (error) {
        console.error("❌ Error seeding market prices:", error.message);
    }
};

module.exports = seedMarketPrices;
