import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

const hash = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

const compare = (plain: string, hashed: string): Promise<boolean> => bcrypt.compare(plain, hashed);

export default { hash, compare };
