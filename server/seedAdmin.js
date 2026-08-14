require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/admin");

async function main() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error("Usage: node seedAdmin.js <username> <password>");
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const passwordHash = await Admin.hashPassword(password);

  const admin = await Admin.findOneAndUpdate(
    { username },
    { username, passwordHash },
    { upsert: true, new: true },
  );

  console.log(`Admin ready: ${admin.username} (id: ${admin._id})`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
