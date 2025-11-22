/**
 * Transaction detection utilities
 * Used by statement processors for payment method and transaction type detection
 */

/**
 * Detect payment method from transaction description
 * Uses pattern matching and scoring for more reliable detection
 */
export function detectPaymentMethod(
  description: string
): "cash" | "card" | "check" | "other" | null {
  const upperDesc = description.toUpperCase();

  // Credit/Debit card patterns (most specific first)
  const cardPatterns = [
    /\bVISA\b/i,
    /\bMC\b/i, // Mastercard abbreviation
    /MASTERCARD/i,
    /\bAMEX\b/i,
    /AMERICAN\s+EXPRESS/i,
    /\bDISCOVER\b/i,
    /CREDIT\s+CARD/i,
    /DEBIT\s+CARD/i,
    /CARD\s+PAYMENT/i,
    /CARD\s*#?\*?\d{4}/i, // Card ending in digits
    /\*{4}\d{4}/i, // ****1234 pattern
    /\bPOS\b/i, // Point of Sale
    /\bCHIP\b/i,
    /CONTACTLESS/i,
    /\bTAP\b/i,
    /E-COMMERCE/i,
    /ONLINE\s+PURCHASE/i,
  ];

  // Check patterns
  const checkPatterns = [
    /\bCHECK\s+#?\d+/i, // Check with number
    /\bCHEQUE\s+#?\d+/i,
    /\bCHK\b/i,
    /\bCHQ\b/i,
    /\bCHECK\b/i,
    /\bCHEQUE\b/i,
  ];

  // Cash patterns
  const cashPatterns = [
    /\bCASH\b/i,
    /ATM\s+WITHDRAWAL/i,
    /\bATM\b/i,
    /CASH\s+WITHDRAWAL/i,
  ];

  // Wire transfer / ACH / EFT patterns
  const transferPatterns = [
    /\bWIRE\b/i,
    /\bACH\b/i,
    /\bEFT\b/i,
    /ELECTRONIC\s+TRANSFER/i,
    /BANK\s+TRANSFER/i,
    /DIRECT\s+DEBIT/i,
  ];

  // Check for each payment method
  if (cardPatterns.some((pattern) => pattern.test(upperDesc))) {
    return "card";
  }

  if (checkPatterns.some((pattern) => pattern.test(upperDesc))) {
    return "check";
  }

  if (cashPatterns.some((pattern) => pattern.test(upperDesc))) {
    return "cash";
  }

  if (transferPatterns.some((pattern) => pattern.test(upperDesc))) {
    return "other";
  }

  // Heuristic: if it mentions "payment" and has a store/merchant name, likely card
  // Only apply if we have some confidence it's a purchase
  if (/\b(PURCHASE|PAYMENT|POS)\b/i.test(upperDesc)) {
    // Check if there's a merchant name pattern (common retail/restaurant names)
    if (
      /\b(STORE|SHOP|RESTAURANT|CAFE|MARKET|GROCERY|GAS|FUEL|PHARMACY)\b/i.test(
        upperDesc
      )
    ) {
      return "card";
    }
  }

  return null;
}

/**
 * Detect payment-related keywords (for credit card payments)
 */
export function detectPaymentKeywords(description: string): boolean {
  const upperDesc = description.toUpperCase();
  return /(?:PAYMENT|PYMT|PAY\s+TO|AUTOPAY|BILL\s+PAY|AUTO\s+PAY)/.test(
    upperDesc
  );
}

/**
 * Detect refund keywords
 */
export function detectRefundKeywords(description: string): boolean {
  const upperDesc = description.toUpperCase();
  return /(?:REFUND|RETURN|CREDIT\s+ADJUSTMENT|REVERSAL)/.test(upperDesc);
}
