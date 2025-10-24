// Script to reset owner account passwords
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function resetOwnerPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'airbnb_clone'
  });

  try {
    // Hash the new password
    const newPassword = 'Password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('🔑 Resetting owner passwords...');
    console.log('New password:', newPassword);
    console.log('Hashed:', hashedPassword);

    // Update passwords for owner accounts (IDs 2, 3, 9)
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE id IN (2, 3, 9) AND role = "owner"',
      [hashedPassword]
    );

    console.log(`✅ Updated ${result.affectedRows} owner account(s)`);

    // Verify the accounts
    const [owners] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE id IN (2, 3, 9)'
    );

    console.log('\n📋 Updated Owner Accounts:');
    owners.forEach(owner => {
      console.log(`  - ID ${owner.id}: ${owner.name} (${owner.email}) - Role: ${owner.role}`);
    });

    console.log('\n✨ You can now login with:');
    console.log('  Email: owner@test.com or bob@test.com or pjdhost@test.com');
    console.log('  Password: Password123');

  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  } finally {
    await connection.end();
  }
}

resetOwnerPasswords();
