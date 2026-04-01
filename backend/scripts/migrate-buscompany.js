/**
 * Migration: Create Default BusCompany and assign all existing Bus/Trip/Station records.
 *
 * Safe to run multiple times (idempotent): if BusCompany with code="DEFAULT" already
 * exists, it will be reused without creating a duplicate.
 *
 * Run with:
 *   node scripts/migrate-buscompany.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const BusCompany = require("../models/busCompanyModel");
const Bus = require("../models/busModel");
const Trip = require("../models/tripModel");
const Station = require("../models/stationModel");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // 1. Find or create the default BusCompany
  let company = await BusCompany.findOne({ code: "DEFAULT" });

  if (company) {
    console.log(`ℹ️  Default BusCompany already exists (id: ${company._id}). Reusing it.`);
  } else {
    company = await BusCompany.create({
      name: "Default Bus Company",
      shortName: "DEFAULT",
      code: "DEFAULT",
      hotline: "",
      description: "Auto-created by migration script. Rename this company via the admin panel.",
      status: "active"
    });
    console.log(`✅ Created BusCompany: "${company.name}" (id: ${company._id})`);
  }

  // 2. Assign all Bus records that have no busCompany
  const busResult = await Bus.updateMany(
    { busCompany: { $in: [null, undefined] } },
    { $set: { busCompany: company._id } }
  );
  console.log(`✅ Buses updated: ${busResult.modifiedCount} records assigned to "${company.name}"`);

  // 3. Assign all Trip records that have no busCompany
  const tripResult = await Trip.updateMany(
    { busCompany: { $in: [null, undefined] } },
    { $set: { busCompany: company._id } }
  );
  console.log(`✅ Trips updated: ${tripResult.modifiedCount} records assigned to "${company.name}"`);

  // 4. Add this BusCompany to all Station.busCompanies arrays (if not already present)
  const stationResult = await Station.updateMany(
    { busCompanies: { $nin: [company._id] } },
    { $addToSet: { busCompanies: company._id } }
  );
  console.log(`✅ Stations updated: ${stationResult.modifiedCount} records now reference "${company.name}"`);

  console.log("\n🎉 Migration complete. Summary:");
  console.log(`   BusCompany id : ${company._id}`);
  console.log(`   BusCompany code: ${company.code}`);
  console.log(`   Buses assigned : ${busResult.modifiedCount}`);
  console.log(`   Trips assigned : ${tripResult.modifiedCount}`);
  console.log(`   Stations linked: ${stationResult.modifiedCount}`);
  console.log("\n👉 Next step: Go to the Admin panel → Bus Companies and rename 'Default Bus Company' to your actual company name.");

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
