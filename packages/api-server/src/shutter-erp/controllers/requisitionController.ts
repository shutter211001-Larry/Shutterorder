import { Request, Response } from "express";
import { prisma } from "../../../lib/db.js";

export const getRequisitions = async (req: any, res: any) => {
  try {
    const tenantId = req.user.tenantId;

    const requisitions = await prisma.requisition.findMany({
      where: { tenantId },
      include: {
        location: true,
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: requisitions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const shipRequisition = async (req: any, res: any) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const requisition = await prisma.requisition.findUnique({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!requisition) {
      return res.status(404).json({ error: "Requisition not found" });
    }

    if (requisition.status !== "PENDING" && requisition.status !== "APPROVED") {
      return res.status(400).json({ error: "Invalid status for shipping" });
    }

    // Process shipment in transaction
    await prisma.$transaction(async (tx: any) => {
      for (const item of requisition.items) {
        // Deduct from central stock
        const ingredient = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
        });
        
        if (!ingredient || ingredient.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ingredient ${item.ingredientId}`);
        }

        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: {
            currentStock: { decrement: item.quantity },
          },
        });

        // Set fulfilled quantity (for now, assume full fulfillment)
        await tx.requisitionItem.update({
          where: { id: item.id },
          data: { fulfilledQty: item.quantity },
        });
      }

      await tx.requisition.update({
        where: { id },
        data: { status: "SHIPPED" },
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
