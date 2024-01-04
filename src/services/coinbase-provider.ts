import Coinbase from "../core/coinbase";
import { PaymentProviderKeys } from "../types";

class CoinbaseProviderService extends Coinbase {
  static identifier = PaymentProviderKeys.COINBASE;

  constructor(_, options) {
    super(_, options);
  }
}

export default CoinbaseProviderService;
