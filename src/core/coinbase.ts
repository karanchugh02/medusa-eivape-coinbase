import { EOL } from "os";
import {
  AbstractPaymentProcessor,
  isPaymentProcessorError,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
} from "@medusajs/medusa";
import { ErrorCodes, CoinbaseOptions } from "../types";
import { MedusaError } from "@medusajs/utils";
import crypto from "crypto";

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
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    console.log("=>>>>>>>>>>calling get payment status");
    // const id = paymentSessionData.id as string;
    // const paymentIntent = await this.razorpay_.orders.fetch(id);

    // switch (paymentIntent.status) {
    //   // created' | 'authorized' | 'captured' | 'refunded' | 'failed'
    //   case "created":
    //     return PaymentSessionStatus.REQUIRES_MORE;

    //   case "paid":
    //     return PaymentSessionStatus.AUTHORIZED;

    //   case "attempted":
    //     return await this.getRazorpayPaymentStatus(paymentIntent);

    //   default:
    //     return PaymentSessionStatus.PENDING;
    // }
    return PaymentSessionStatus.PENDING;
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    return {
      session_data: {} as any,
      update_requests:
        //  customer?.metadata?.razorpay_id
        //   ? undefined
        {
          customer_metadata: {},
        },
    };
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
    console.log("=>>>>>>>>>>calling cancel payment", paymentSessionData);
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
    return paymentSessionData;
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    return paymentSessionData;
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse | void> {
    console.log("=>>>>>>>>>>calling update payment", context);

    return { session_data: context.paymentSessionData };
  }

  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<
    PaymentProcessorSessionResponse["session_data"] | PaymentProcessorError
  > {
    return data;
  }
}

export default Coinbase;
