import express from "express";
import { getRequisitions, shipRequisition } from "../controllers/requisitionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware as any);

router.get("/", getRequisitions);
router.post("/:id/ship", shipRequisition);

export default router;
