// Script bảo trì: sinh lại toàn bộ PDF hợp đồng cho các booking hiện có.
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Booking = require("./models/Booking");
require("./models/User");
require("./models/Service");
const { generateContractPdf } = require("./utils/contractPdf");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const bookings = await Booking.find({ contract_token: { $ne: null } })
      .populate("customer_id", "full_name email phone")
      .populate("service_id", "name base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("photographer_ids", "full_name email");

    console.log(`Found ${bookings.length} bookings to regenerate PDFs for.`);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    for (const booking of bookings) {
      const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`;
      console.log(`Regenerating PDF for booking ${booking._id}...`);
      await generateContractPdf(booking, contractLink);
    }

    console.log("All PDFs regenerated successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
