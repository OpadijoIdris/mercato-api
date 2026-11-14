import { z } from 'zod';
import config from '../config/env.js';
import { createProductSchema } from '../product/schemas/ProductSchema.js';
import { createUserSchema, updateUserSchema } from '../user/schemas/UserSchema.js';

// Request bodies are generated from the same Zod schemas the controllers validate with, so the
// docs can't drift from the real rules. `io: 'input'` describes what clients send.
const requestSchema = (schema: z.ZodType) => {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, { io: 'input' });
  return jsonSchema;
};

const envelope = (data: Record<string, unknown>) => ({
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['success', 'failed'] },
    message: { type: 'string' },
    data,
  },
});

// Shared by every list endpoint (see src/util/pagination.ts).
const pageParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const paginated = (itemRef: string) => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: { $ref: itemRef } },
    pagination: { $ref: '#/components/schemas/Pagination' },
  },
});

const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Mercato API',
    version: '1.0.0',
    description:
      'Mercato e-commerce API. Every response uses the { status, message, data } envelope, ' +
      'and every list endpoint is paginated as { items, pagination }.',
  },
  servers: [{ url: config.apiUrl, description: 'API server' }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: { '200': { description: 'Service is up' } },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products (paginated, newest first)',
        parameters: [
          ...pageParams,
          {
            name: 'search',
            in: 'query',
            description: 'Case-insensitive match on product name',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Products',
            content: {
              'application/json': {
                schema: envelope(paginated('#/components/schemas/Product')),
              },
            },
          },
          '400': { description: 'Invalid query parameters' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateProductInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Product created',
            content: {
              'application/json': { schema: envelope({ $ref: '#/components/schemas/Product' }) },
            },
          },
          '400': { description: 'Validation failed or malformed JSON body' },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get a product by id',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Product',
            content: {
              'application/json': { schema: envelope({ $ref: '#/components/schemas/Product' }) },
            },
          },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (paginated, newest first)',
        parameters: [
          ...pageParams,
          { name: 'role', in: 'query', schema: { $ref: '#/components/schemas/Role' } },
          {
            name: 'search',
            in: 'query',
            description: 'Case-insensitive match on email, first name or last name',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Users',
            content: {
              'application/json': {
                schema: envelope(paginated('#/components/schemas/User')),
              },
            },
          },
          '400': { description: 'Invalid query parameters' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateUserInput' } },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': { schema: envelope({ $ref: '#/components/schemas/User' }) },
            },
          },
          '400': { description: 'Validation failed' },
          '409': { description: 'Email already in use' },
        },
      },
    },
    '/users/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['Users'],
        summary: 'Get a user by id',
        responses: {
          '200': {
            description: 'User',
            content: {
              'application/json': { schema: envelope({ $ref: '#/components/schemas/User' }) },
            },
          },
          '404': { description: 'User not found' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update a user',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateUserInput' } },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': { schema: envelope({ $ref: '#/components/schemas/User' }) },
            },
          },
          '400': { description: 'Validation failed' },
          '404': { description: 'User not found' },
          '409': { description: 'Email already in use' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        responses: {
          '200': { description: 'User deleted' },
          '404': { description: 'User not found' },
        },
      },
    },
  },
  components: {
    schemas: {
      Role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: ['string', 'null'] },
          role: { $ref: '#/components/schemas/Role' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer', description: 'Items matching the filters, across all pages' },
          totalPages: { type: 'integer' },
        },
      },
      CreateUserInput: requestSchema(createUserSchema),
      UpdateUserInput: requestSchema(updateUserSchema),
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          price: { type: 'integer', description: 'Smallest currency unit (kobo, cents)' },
          stock: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductInput: requestSchema(createProductSchema),
    },
  },
};

export default openapi;
