const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://orso081980:SsQWfKH1YlIPS3Yc@cluster0.hikyqvz.mongodb.net/Altzheimer";

async function testUser(email) {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    retryWrites: true,
    retryReads: true,
  };
  
  const client = new MongoClient(MONGODB_URI, options);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("Altzheimer");
    const users = db.collection("users");

    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("=== USER FOUND ===");
    console.log("Email:", user?.email);
    console.log("Name:", user?.name);
    console.log("Role:", user?.role);
    console.log("IsActive:", user?.isActive);
    console.log("Password exists:", !!user?.password);
    console.log("Password length:", user?.password?.length);
    console.log("Password starts with $2b:", user?.password?.startsWith("$2b$"));
    console.log("Created:", user?.createdAt);
    console.log("Updated:", user?.updatedAt);
    console.log("Last Login:", user?.lastLogin);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

// Usage: node test-user.js your@email.com
const email = process.argv[2];
if (!email) {
  console.log("Usage: node test-user.js your@email.com");
  console.log("Example: node test-user.js fangalasso@gmail.com");
  process.exit(1);
}

console.log("Testing user:", email);
testUser(email);
