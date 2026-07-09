import { Request, Response } from 'express';
import prisma from '../lib/db.js';
import { tenantStorage } from '../middleware/tenantStorage.js';

interface Checkpoint {
  updatedAt: string;
  id: string;
}

export async function pullReplication(req: Request, res: Response): Promise<void> {
  const store = tenantStorage.getStore();
  const tenantId = store?.tenantId;
  
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
    return;
  }

  const { collection } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const lastUpdatedAt = req.query.lastUpdatedAt as string | undefined;
  const lastId = req.query.lastId as string | undefined;

  try {
    let documents: any[] = [];
    
    // Checkpoint 查詢條件
    const cursorCondition = lastUpdatedAt && lastId ? {
      OR: [
        { updatedAt: { gt: new Date(lastUpdatedAt) } },
        { updatedAt: new Date(lastUpdatedAt), id: { gt: lastId } }
      ]
    } : {};

    if (collection === 'categories') {
      documents = await prisma.category.findMany({
        where: { tenantId, ...cursorCondition },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit + 1
      });
    } else if (collection === 'menuItems') {
      documents = await prisma.menuItem.findMany({
        where: { tenantId, ...cursorCondition },
        include: { category: true, options: { include: { values: true } } },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit + 1
      });
      // 為了配合 RxDB schema，將 category 轉換為純物件
      documents = documents.map(d => ({
        ...d,
        category: d.category ? { id: d.category.id, name: d.category.name } : null
      }));
    } else if (collection === 'orders') {
      documents = await prisma.order.findMany({
        where: { tenantId, ...cursorCondition },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit + 1
      });
    } else {
      res.status(400).json({ error: 'Unknown collection' });
      return;
    }

    const hasMoreDocuments = documents.length > limit;
    if (hasMoreDocuments) {
      documents.pop(); // 移除多抓的那一筆
    }

    const lastDoc = documents[documents.length - 1];
    const checkpoint = lastDoc ? {
      updatedAt: lastDoc.updatedAt.toISOString(),
      id: lastDoc.id
    } : { lastUpdatedAt, lastId };

    // 將所有 DateTime 轉成 string 以符合 RxDB JSON Schema
    const formattedDocs = documents.map(d => ({
      ...d,
      createdAt: d.createdAt?.toISOString(),
      updatedAt: d.updatedAt?.toISOString()
    }));

    res.json({
      documents: formattedDocs,
      checkpoint,
      hasMoreDocuments
    });
  } catch (error) {
    console.error('[Replication Pull Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function pushReplication(req: Request, res: Response): Promise<void> {
  const store = tenantStorage.getStore();
  const tenantId = store?.tenantId;
  
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
    return;
  }

  const { collection } = req.params;
  const { documents } = req.body; // 接收前端推播的陣列

  if (!Array.isArray(documents)) {
    res.status(400).json({ error: 'Expected an array of documents' });
    return;
  }

  try {
    const conflicts: any[] = [];
    
    if (collection === 'orders') {
      for (const doc of documents) {
        // Last-Write-Wins (Server Wins)
        // 簡單的 upsert 策略
        await prisma.order.upsert({
          where: { id: doc.id },
          create: {
            id: doc.id,
            tenantId,
            locationId: doc.locationId,
            orderNumber: doc.orderNumber || `R-${doc.id.substring(0, 8)}`,
            orderType: doc.orderType || 'DINE_IN',
            subtotal: doc.subtotal || doc.total || doc.totalAmount || 0,
            status: doc.status || 'PENDING',
            total: doc.total || doc.totalAmount || 0,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: new Date()
          },
          update: {
            status: doc.status,
            total: doc.total || doc.totalAmount || 0,
            updatedAt: new Date()
          }
        });
      }
    } else {
      res.status(400).json({ error: 'Push not supported for this collection' });
      return;
    }

    res.json({ success: true, conflicts });
  } catch (error) {
    console.error('[Replication Push Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
