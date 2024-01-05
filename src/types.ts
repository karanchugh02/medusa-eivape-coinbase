export interface CoinbaseOptions {
  COINBASE_API_KEY: string;
  COINBASE_CHARGE_NAME: string;
  COINBASE_CHARGE_DESCRIPTION: string;
}

export const ErrorCodes = {
  PAYMENT_INTENT_UNEXPECTED_STATE: "payment_intent_unexpected_state",
  UNSUPPORTED_OPERATION: "payment_intent_operation_unsupported",
};

export const ErrorIntentStatus = {
  SUCCEEDED: "succeeded",
  CANCELED: "canceled",
};

export const PaymentProviderKeys = {
  COINBASE: "coinbase",
};
