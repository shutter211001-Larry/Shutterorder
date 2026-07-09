import { RxJsonSchema, toTypedRxJsonSchema, ExtractDocumentTypeFromTypedRxJsonSchema } from 'rxdb';

// 1. Category Schema (唯讀/從後端同步下來)
export const categorySchemaLiteral = {
  title: 'category schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    parentId: { type: 'string', maxLength: 100 },
    sortOrder: { type: 'number' },
    isActive: { type: 'boolean' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'name', 'isActive']
} as const;

const categorySchemaTyped = toTypedRxJsonSchema(categorySchemaLiteral);
export type CategoryDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof categorySchemaTyped>;
export const categorySchema: RxJsonSchema<CategoryDocType> = categorySchemaLiteral;

// 1.5. MenuItem Schema
export const menuItemSchemaLiteral = {
  title: 'menu item schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    price: { type: 'number' },
    isActive: { type: 'boolean' },
    updatedAt: { type: 'string', format: 'date-time' },
    category: {
      type: ['object', 'null'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          values: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                priceModifier: { type: 'number' }
              }
            }
          }
        }
      }
    }
  },
  required: ['id', 'name', 'price', 'isActive']
} as const;

const menuItemSchemaTyped = toTypedRxJsonSchema(menuItemSchemaLiteral);
export type MenuItemDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof menuItemSchemaTyped>;
export const menuItemSchema: RxJsonSchema<MenuItemDocType> = menuItemSchemaLiteral;

// 2. Order Schema (本地寫入/需同步回後端)
export const orderSchemaLiteral = {
  title: 'order schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    locationId: { type: 'string', maxLength: 100 },
    status: { type: 'string' },
    totalAmount: { type: 'number' },
    orderType: { type: 'string' },
    guestName: { type: ['string', 'null'] },
    guestPhone: { type: ['string', 'null'] },
    guestEmail: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          menuItemId: { type: 'string' },
          quantity: { type: 'number' },
          price: { type: 'number' },
          notes: { type: 'string' }
        },
        required: ['menuItemId', 'quantity', 'price']
      }
    },
    // 用於標記這筆訂單是否已經同步到雲端
    _isSynced: { type: 'boolean', default: false }
  },
  required: ['id', 'locationId', 'status', 'totalAmount', 'createdAt']
} as const;

const orderSchemaTyped = toTypedRxJsonSchema(orderSchemaLiteral);
export type OrderDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof orderSchemaTyped>;
export const orderSchema: RxJsonSchema<OrderDocType> = orderSchemaLiteral;
