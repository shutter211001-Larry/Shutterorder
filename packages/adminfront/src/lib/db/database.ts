import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { categorySchema, menuItemSchema, orderSchema } from './schema.js';

// 註冊常用擴充套件
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

let dbPromise: any = null;

const createDatabase = async () => {
  const db = await createRxDatabase({
    name: 'shutter_pos_localdb',
    storage: getRxStorageDexie(), // 底層使用 Dexie (IndexedDB)
    multiInstance: true,          // 允許跨分頁同步
    eventReduce: true             // 優化查詢效能
  });

  // 建立集合 (Tables)
  await db.addCollections({
    categories: {
      schema: categorySchema
    },
    menuItems: {
      schema: menuItemSchema
    },
    orders: {
      schema: orderSchema
    }
  });

  // TODO: 之後在這裡設定與 Node.js 後端的 Replication 同步機制
  
  return db;
};

// Singleton 模式，確保整個 App 共用同一個 DB 實體
export const getDatabase = () => {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
};
