import { Router, type IRouter } from "express";
import healthRouter from "./health";
import salonRouter from "./salon";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok", service: "al-baron-api" });
});
router.use(healthRouter);
router.use(salonRouter);

export default router;
