import { Router } from "express";
import bodyParser from "body-parser";
import { wrapHandler } from "@medusajs/medusa";
import coinbase from "./coinbase";

const route = Router();

export default (app) => {
  app.use("/coinbase", route);
  route.post(
    "/hooks",
    bodyParser.raw({ type: "application/json" }),
    wrapHandler(coinbase)
  );
  return app;
};
