import { EOL } from "os";
import {
  AbstractPaymentProcessor,
  isPaymentProcessorError,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  PaymentStatus,
} from "@medusajs/medusa";
import { ErrorCodes, CoinbaseOptions } from "../types";
import { MedusaError } from "@medusajs/utils";
import crypto from "crypto";
import coinbase from "coinbase-commerce-node";
import moment from "moment";
import axios from "axios";
const Client = coinbase.Client;
const Charge = coinbase.resources.Charge;

/**
 * The paymentIntent object corresponds to a razorpay order.
 *
 */

abstract class Coinbase extends AbstractPaymentProcessor {
  static identifier = "";

  protected readonly options_: CoinbaseOptions;

  protected constructor(_, options) {
    super(_, options);

    this.options_ = options;
    this.init();
  }

  protected init() {
    Client.init(this.options_.COINBASE_API_KEY);
  }

  async getCoinbasePaymentStatus(id: string) {
    let chargeData = await Charge.retrieve(id);
    return chargeData.timeline[chargeData.timeline.length - 1].status;
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    console.log("=>>>>>>>>>>calling get payment status");
    let chargeData = await Charge.retrieve(paymentSessionData.id as string);
    let finalStatus: PaymentSessionStatus = PaymentSessionStatus.PENDING;
    chargeData.timeline.map((activity) => {
      switch (activity.status) {
        case "NEW":
          finalStatus = PaymentSessionStatus.PENDING;
          break;
        case "PENDING":
          finalStatus = PaymentSessionStatus.AUTHORIZED;
          break;
        case "COMPLETED":
          finalStatus = PaymentSessionStatus.AUTHORIZED;
          break;
        case "EXPIRED":
          finalStatus = PaymentSessionStatus.ERROR;
          break;
        case "CANCELED":
          finalStatus = PaymentSessionStatus.CANCELED;
          break;
        case "UNRESOLVED":
          finalStatus = PaymentSessionStatus.CANCELED;
          break;
        default:
          finalStatus = PaymentSessionStatus.PENDING;
          break;
      }
    });
    return finalStatus;
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      let {
        amount,
        currency_code,
        paymentSessionData,
        email,
        customer,
        billing_address,
        resource_id,
      } = context;
      console.log(
        "=>>>>>>>>>>>>calling initiate payment",
        paymentSessionData,
        resource_id
      );

      let res = await axios.post(
        "https://api.commerce.coinbase.com/charges",
        {
          name: this.options_.COINBASE_CHARGE_NAME,
          description: this.options_.COINBASE_CHARGE_DESCRIPTION,
          pricing_type: "fixed_price",
          local_price: { amount: "0.2", currency: "USD" },
          metadata: {
            customer_id: customer?.id,
            email,
            cart_id: resource_id,
          },
          redirect_url: `http://localhost:8000/order/confirmed/${resource_id}`,
          cancel_url: `http://localhost:8000/checkout`,
        },
        {
          headers: {
            "X-CC-Api-Key": this.options_.COINBASE_API_KEY,
            "X-CC-Version": "2018-03-22",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("res");

      console.dir(res.data, { depth: null });

      return {
        session_data: res.data.data as any,
        update_requests: undefined,
      };
    } catch (e) {
      console.dir(e, { depth: null });
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Error in initiating payment!!!"
      );
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: PaymentProcessorSessionResponse["session_data"];
      }
  > {
    console.log("=>>>>>>>>>>calling authorize payment");
    const status = await this.getPaymentStatus(paymentSessionData);
    return { data: paymentSessionData, status };
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    let coinbaseStatus = await this.getCoinbasePaymentStatus(
      paymentSessionData.id as string
    );
    if (coinbaseStatus != "NEW") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot cancel charge with status not as New"
      );
    }

    return paymentSessionData;
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    return paymentSessionData;
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    console.log("=>>>>>>>>>>calling delete payment");
    return await this.cancelPayment(paymentSessionData);
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Refund not possible with coinbase"
    );
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    const id = paymentSessionData.id as string;
    const intent = await Charge.retrieve(id);
    return intent as unknown as PaymentProcessorSessionResponse["session_data"];
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse | void> {
    console.log("=>>>>>>>>>>calling update payment", context);
    //cancelling previous payment
    if (
      context.paymentSessionData.data &&
      //@ts-ignore
      (context.paymentSessionData.data.id as string)
    ) {
      await this.cancelPayment(context.paymentSessionData);
    }

    const newPaymentSessionOrder = (await this.initiatePayment(
      context
    )) as PaymentProcessorSessionResponse;

    return { session_data: { ...newPaymentSessionOrder.session_data } };
  }

  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<
    PaymentProcessorSessionResponse["session_data"] | PaymentProcessorError
  > {
    if (data.amount || data.currency) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot update amount, use updatePayment instead"
      );
    }
    return data;
  }
}

export default Coinbase;
