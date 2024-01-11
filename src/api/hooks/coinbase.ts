import { Webhook } from "coinbase-commerce-node";
import dotenv from "dotenv";
dotenv.config();
export default async (req, res) => {
  const event: any = Webhook.verifyEventBody(
    req.rawBody,
    req.headers["x-cc-webhook-signature"],
    process.env.COINBASE_WEBHOOK_SECRET || ""
  );

  let cartId = event.data.metadata.cart_id;
  const orderService = req.scope.resolve("orderService");
  const order = await orderService
    .retrieveByCartId(cartId)
    .catch(() => undefined);
  switch (event.type) {
    case "charge:confirmed":
      await orderService.capturePayment(order.id, {
        status: "captured",
      });
      break;
    default:
      await orderService.update(order._id, {
        status: "requires_action",
      });
      break;
  }

  res.sendStatus(200);
};
