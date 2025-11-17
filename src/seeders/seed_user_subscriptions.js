const db = require("../config/db");

async function seedUserSubscriptions() {
  try {
    // Check if user_subscriptions already has data
    const [existing] = await db.query(
      "SELECT COUNT(*) as count FROM user_subscriptions"
    );
    if (existing[0].count > 0) {
      console.log("User subscriptions already exist. Skipping seed.");
      return;
    }

    console.log("Starting user subscriptions seeding...");

    // Get all current users from the NEW users table
    const [currentUsers] = await db.query(`
      SELECT id, first_name, second_name, phone, package_id, expiry_date, last_payment_date 
      FROM users
    `);

    // Get all packages
    const [packages] = await db.query("SELECT id, name, price FROM packages");

    console.log(`Found ${currentUsers.length} users in the database`);
    console.log(`Found ${packages.length} packages in the database`);

    let successCount = 0;
    let skippedCount = 0;

    // Create subscriptions for each user
    for (const user of currentUsers) {
      try {
        // Skip if user doesn't have a package_id
        if (!user.package_id) {
          console.log(
            `User ${user.id} (${user.first_name} ${user.second_name}) has no package. Skipping.`
          );
          skippedCount++;
          continue;
        }

        // Calculate start_date (30 days before expiry or use last_payment_date)
        let startDate;
        if (user.last_payment_date) {
          startDate = user.last_payment_date;
        } else if (user.expiry_date) {
          const expiry = new Date(user.expiry_date);
          const start = new Date(expiry);
          start.setDate(start.getDate() - 30);
          startDate = start.toISOString().split("T")[0];
        } else {
          // Default to 30 days ago
          const start = new Date();
          start.setDate(start.getDate() - 30);
          startDate = start.toISOString().split("T")[0];
        }

        // Determine status based on expiry_date
        let status = "active";
        if (user.expiry_date) {
          const expiryDate = new Date(user.expiry_date);
          const today = new Date();
          if (expiryDate < today) {
            status = "expired";
          }
        }

        // Insert user subscription
        await db.query(
          `
          INSERT INTO user_subscriptions (
            user_id,
            package_id,
            start_date,
            expiry_date,
            status,
            payment_id,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
          [
            user.id,
            user.package_id,
            startDate,
            user.expiry_date || null,
            status,
            null, // payment_id will be null for now
          ]
        );

        successCount++;

        if (successCount % 10 === 0) {
          console.log(`   ... processed ${successCount} subscriptions`);
        }
      } catch (error) {
        console.log(
          `Failed to create subscription for user ${user.id}:`,
          error.message
        );
        skippedCount++;
      }
    }

    console.log(`\nSuccessfully created ${successCount} user subscriptions`);
    if (skippedCount > 0) {
      console.log(
        `Skipped ${skippedCount} subscriptions (no package or errors)`
      );
    }
  } catch (error) {
    console.error("Error seeding user subscriptions:", error);
    throw error;
  }
}

module.exports = seedUserSubscriptions;
