// seedCustomerReviews.js

const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://DarshRajputApp:tst4I6oi6m77xXJS@cluster0.jfptrcd.mongodb.net/ChargeNexus";

const reviewCollection = "customer_reviews";

const reviewTemplates = {
  BUG: [
    {
      title: "App crashes during charging",
      message:
        "The app suddenly crashed while starting the charging session.",
      rating: 1,
      sentiment: "negative",
      tags: ["APP_ISSUE", "SESSION_ISSUE"],
      department: "Software",
      priority: "HIGH",
    },
    {
      title: "Payment deducted but charging not started",
      message:
        "Money got deducted but charger never started charging.",
      rating: 1,
      sentiment: "negative",
      tags: ["PAYMENT_ISSUE"],
      department: "Finance",
      priority: "URGENT",
    },
    {
      title: "Charger disconnected automatically",
      message:
        "Charging stopped automatically after few minutes.",
      rating: 2,
      sentiment: "negative",
      tags: ["CHARGER_ISSUE"],
      department: "Operations",
      priority: "HIGH",
    },
  ],

  ENHANCEMENT: [
    {
      title: "Please add dark mode",
      message:
        "Would love to have dark mode support in the mobile app.",
      rating: 4,
      sentiment: "positive",
      tags: ["UI_ENHANCEMENT"],
      department: "Mobile App",
      priority: "LOW",
    },
    {
      title: "Need charging history export",
      message:
        "Please provide PDF or Excel export for charging history.",
      rating: 4,
      sentiment: "neutral",
      tags: ["FEATURE_REQUEST"],
      department: "Software",
      priority: "MEDIUM",
    },
  ],

  PRAISE: [
    {
      title: "Great charging experience",
      message:
        "Fast charging and smooth app experience overall.",
      rating: 5,
      sentiment: "positive",
      tags: ["APP_EXPERIENCE"],
      department: "Support",
      priority: "LOW",
    },
    {
      title: "Excellent UI",
      message:
        "The app UI is very clean and charging process is easy.",
      rating: 5,
      sentiment: "positive",
      tags: ["UX_FEEDBACK"],
      department: "Mobile App",
      priority: "LOW",
    },
  ],

  PERFORMANCE: [
    {
      title: "App feels slow",
      message:
        "The app takes too much time to load charger details.",
      rating: 2,
      sentiment: "negative",
      tags: ["PERFORMANCE"],
      department: "Software",
      priority: "MEDIUM",
    },
  ],
};

const appVersions = [
  "2.1.0",
  "2.1.1",
  "2.2.0",
  "2.3.0",
  "2.4.1",
];

const devices = [
  {
    os: "Android",
    os_version: "14",
    device_model: "Samsung S24",
  },
  {
    os: "Android",
    os_version: "13",
    device_model: "OnePlus 12",
  },
  {
    os: "iOS",
    os_version: "17",
    device_model: "iPhone 15",
  },
];

const sources = [
  "APP",
  "PLAYSTORE",
  "APPSTORE",
  "EMAIL",
];

const reviewTypes = [
  "BUG",
  "ENHANCEMENT",
  "PRAISE",
  "PERFORMANCE",
];

const statuses = [
  "pending",
  "analyzed",
  "ignored",
];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(days = 30) {
  return new Date(
    Date.now() - Math.floor(Math.random() * days) * 86400000
  );
}

async function seedCustomerReviews() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("🚀 MongoDB Connected");

    const db = mongoose.connection.db;

    const customers = await db
      .collection("customers")
      .find({})
      .toArray();

    const bookings = await db
      .collection("bookings")
      .find({})
      .toArray();

    const reviews = [];

    for (let i = 0; i < 120; i++) {
      const type = random(reviewTypes);

      const template = random(reviewTemplates[type]);

      const customer = random(customers);

      const booking = random(bookings);

      reviews.push({
        customer_id: customer?._id || null,

        source: random(sources),

        review_type: type,

        rating: template.rating,

        review_title: template.title,

        review_message: template.message,

        sentiment: template.sentiment,

        detected_tags: template.tags,

        ai_analysis: {
          issue_type: template.tags[0],
          department: template.department,
          priority: template.priority,
          confidence_score: Number(
            (Math.random() * (0.99 - 0.75) + 0.75).toFixed(2)
          ),
          enhancement_detected:
            type === "ENHANCEMENT",

          duplicate_possible: Math.random() > 0.8,
        },

        related_ticket_id: null,

        app_version: random(appVersions),

        device_info: random(devices),

        session_context: {
          booking_id: booking?._id || null,
          charger_id: booking?.charger_id || null,
          station_id: booking?.station_id || null,
        },

        status: random(statuses),

        created_at: randomDate(),
        updated_at: new Date(),
      });
    }

    await db.collection(reviewCollection).deleteMany({});

    await db
      .collection(reviewCollection)
      .insertMany(reviews);

    console.log(
      `✅ ${reviews.length} customer reviews inserted`
    );

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

seedCustomerReviews();