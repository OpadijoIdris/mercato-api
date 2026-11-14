import { z } from 'zod';
import { pageQueryShape } from '../../util/pagination.js';
import { optionalText } from '../../util/validate.js';
import { Role } from '../constants/Roles.js';

// Each schema is the single source of truth for its shape: the TypeScript type is inferred from
// it, so validation and types can't drift apart.

// Trimmed before the email check; the meta keeps `format: email` in the generated API docs.
const email = z
  .string()
  .trim()
  .meta({ format: 'email', maxLength: 254, example: 'jane.doe@example.com' })
  .pipe(z.email().max(254));
const name = z.string().trim().min(1).max(100);
// Loose E.164: optional +, then 7–15 digits.
const phone = optionalText(
  z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, 'must be 7-15 digits, optionally starting with +')
    .meta({ example: '+2348012345678' }),
);

export const createUserSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated.
  password: z.string().min(8).max(72),
  firstName: name,
  lastName: name,
  phone,
  role: z.enum(Role).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({ email, firstName: name, lastName: name, phone, role: z.enum(Role) })
  .partial()
  .refine((values) => Object.values(values).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  })
  .meta({ minProperties: 1 });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  ...pageQueryShape,
  role: z.enum(Role).optional(),
  // Case-insensitive match against email, first name and last name.
  search: optionalText(z.string().trim().max(100)),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
