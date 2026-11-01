// Google Pay™ API — PAYMENT_GATEWAY tokenization request builder (isomorphic, pure).

export type GooglePayEnv = "TEST" | "PRODUCTION";

export type GooglePayConfig = {
  environment: GooglePayEnv;
  merchantId: string;
  merchantName: string;
  gateway: string; // e.g. "stripe", "adyen", "checkoutltd"
  gatewayMerchantId: string;
};

const baseCard = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
  },
};

export function buildPaymentDataRequest(cfg: GooglePayConfig, amount: number, currency: string, countryCode = "MA") {
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [{
      ...baseCard,
      tokenizationSpecification: {
        type: "PAYMENT_GATEWAY",
        parameters: { gateway: cfg.gateway, gatewayMerchantId: cfg.gatewayMerchantId },
      },
    }],
    merchantInfo: { merchantId: cfg.merchantId, merchantName: cfg.merchantName },
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPrice: Number(amount).toFixed(2),
      currencyCode: currency.toUpperCase(),
      countryCode,
    },
  };
}

export const GOOGLE_PAY_SDK = "https://pay.google.com/gp/p/js/pay.js";
