import Joi from 'joi';
import { pageQueryFields } from '../../util/pagination.js';
import { ROLES } from '../constants/Roles.js';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../models/User.js';

const name = Joi.string().trim().min(1).max(100);
// Loose E.164: optional +, then 7–15 digits.
const phone = Joi.string()
  .trim()
  .pattern(/^\+?[0-9]{7,15}$/)
  .empty('')
  .allow(null)
  .messages({ 'string.pattern.base': '"phone" must be 7-15 digits, optionally starting with +' });

export const createUserSchema = Joi.object<CreateUserInput>({
  email: Joi.string().trim().email().max(254).required(),
  // bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated.
  password: Joi.string().min(8).max(72).required(),
  firstName: name.required(),
  lastName: name.required(),
  phone: phone.optional(),
  role: Joi.string()
    .valid(...ROLES)
    .optional(),
});

export const updateUserSchema = Joi.object<UpdateUserInput>({
  email: Joi.string().trim().email().max(254),
  firstName: name,
  lastName: name,
  phone,
  role: Joi.string().valid(...ROLES),
}).min(1);

export const listUsersQuerySchema = Joi.object<ListUsersQuery>({
  ...pageQueryFields,
  role: Joi.string().valid(...ROLES),
  search: Joi.string().trim().max(100).empty(''),
});
