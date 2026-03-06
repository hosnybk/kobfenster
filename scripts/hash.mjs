import bcrypt from 'bcryptjs';

const pwd = process.argv[2] || process.env.PASSWORD;
if (!pwd) {
  console.error('Usage: node scripts/hash.mjs "<password>"');
  process.exit(1);
}
const rounds = Number(process.env.ROUNDS || 10);
const hash = bcrypt.hashSync(pwd, rounds);
console.log(hash);

