import { promisePool } from '../config/db.js';

async function addCompletedStatus() {
  try {
    console.log('🔄 Adding COMPLETED status to bookings table...\n');

    // Alter the enum to include COMPLETED
    await promisePool.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN status ENUM('PENDING','ACCEPTED','CANCELLED','COMPLETED') 
      DEFAULT 'PENDING'
    `);

    console.log('✅ Successfully added COMPLETED status to enum\n');

    // Update past bookings to COMPLETED
    const [result] = await promisePool.query(`
      UPDATE bookings 
      SET status = 'COMPLETED' 
      WHERE status = 'ACCEPTED' 
        AND check_out < CURDATE()
    `);

    console.log(`✅ Updated ${result.affectedRows} past bookings to COMPLETED status\n`);

    // Show updated distribution
    const [stats] = await promisePool.query(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'PENDING' THEN 1
          WHEN 'ACCEPTED' THEN 2
          WHEN 'COMPLETED' THEN 3
          WHEN 'CANCELLED' THEN 4
        END
    `);

    console.log('📊 Updated Booking Status Distribution:');
    console.table(stats);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addCompletedStatus();
