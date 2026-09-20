/**
 * Usage: npx tsx scripts/admin-hash-password.ts "your password"
 * Prints a scrypt hash to put in ADMIN_PASSWORD_HASH (.env.local).
 */
import { hashPassword } from "../src/lib/admin-auth";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npx tsx scripts/admin-hash-password.ts "your password"');
  process.exit(1);
}
console.log(hashPassword(password));
