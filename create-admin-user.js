const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://orso081980:EYxth0SnyUC9fihc@cluster0.hikyqvz.mongodb.net/Altzheimer";
const DB_NAME = "Altzheimer";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔐 Admin User Creation Script");
    console.log("===============================\n");

    // Get user input
    const name = await askQuestion("Enter admin name: ");
    const email = await askQuestion("Enter admin email: ");
    const password = await askQuestion("Enter admin password (min 8 chars): ");

    // Validate input
    if (!name || !email || !password) {
      console.error("❌ All fields are required!");
      process.exit(1);
    }

    if (password.length < 8) {
      console.error("❌ Password must be at least 8 characters long!");
      process.exit(1);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("❌ Please enter a valid email address!");
      process.exit(1);
    }

    console.log("\n⏳ Connecting to database...");
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error(`❌ User with email "${email}" already exists!`);
      process.exit(1);
    }

    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("👤 Creating admin user...");
    const now = new Date();
    const adminUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name,
      role: "admin",
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    const result = await users.insertOne(adminUser);

    console.log("\n✅ Success! Admin user created:");
    console.log(`   📧 Email: ${email}`);
    console.log(`   👤 Name: ${name}`);
    console.log(`   🔑 Role: admin`);
    console.log(`   🆔 User ID: ${result.insertedId}`);
    console.log("\n🎉 You can now sign in at: http://localhost:3000/auth/signin");
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  } finally {
    await client.close();
    rl.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node create-admin-user.js");
  console.log("This script will prompt you for admin user details.");
  process.exit(0);
}

createAdminUser();
