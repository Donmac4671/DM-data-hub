export interface NetworkValidationResult {
  isValid: boolean;
  errorMessage?: string;
  normalizedPhone?: string;
  detectedNetwork?: 'MTN' | 'Telecel' | 'AirtelTigo' | 'Unknown';
}

/**
 * Validates a Ghana mobile phone number against network prefix rules.
 * 
 * Rules:
 * - MTN: 024, 054, 055, 059, 025, 053
 * - Telecel: 020, 050
 * - AirtelTigo / AT: 027, 057, 026, 056
 * - SPECIAL EXCEPTION: 0278213799 can ONLY place an order for MTN!
 */
export function validateGhanaNetworkPhone(phone: string, network: string): NetworkValidationResult {
  const raw = phone.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (!raw) {
    return { isValid: false, errorMessage: 'Recipient phone number is required.' };
  }

  // Normalize phone number to 10-digit format starting with 0
  let clean = raw;
  if (clean.startsWith('+233')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('233')) {
    clean = '0' + clean.slice(3);
  }

  if (clean.length !== 10 || !clean.startsWith('0')) {
    return {
      isValid: false,
      errorMessage: `Invalid Ghana phone number format (${phone}). Must be 10 digits e.g. 0241234567.`,
    };
  }

  const netLower = network.toLowerCase();

  // SPECIAL EXCEPTION RULE: 0278213799 is a special number that CAN ONLY place an order for MTN!
  if (clean === '0278213799') {
    if (netLower === 'mtn') {
      return { isValid: true, normalizedPhone: clean, detectedNetwork: 'MTN' };
    } else {
      return {
        isValid: false,
        errorMessage: `Phone number 0278213799 is a special number restricted ONLY for MTN orders! Selected network (${network.toUpperCase()}) is not allowed.`,
      };
    }
  }

  const prefix = clean.slice(0, 3); // e.g. '024', '020', '027'

  const mtnPrefixes = ['024', '054', '055', '059', '025', '053'];
  const telecelPrefixes = ['020', '050'];
  const atPrefixes = ['027', '057', '026', '056'];

  if (netLower === 'mtn') {
    if (mtnPrefixes.includes(prefix)) {
      return { isValid: true, normalizedPhone: clean, detectedNetwork: 'MTN' };
    }
    return {
      isValid: false,
      errorMessage: `Invalid MTN number! Prefix '${prefix}' (${clean}) belongs to another network. MTN prefixes are 024, 054, 055, 059, 025, 053.`,
    };
  }

  if (netLower === 'telecel' || netLower === 'vodafone') {
    if (telecelPrefixes.includes(prefix)) {
      return { isValid: true, normalizedPhone: clean, detectedNetwork: 'Telecel' };
    }
    return {
      isValid: false,
      errorMessage: `Invalid Telecel number! Prefix '${prefix}' (${clean}) belongs to another network. Telecel prefixes are 020, 050.`,
    };
  }

  if (
    netLower === 'airteltigo_ishare' ||
    netLower === 'airteltigo_bigtime' ||
    netLower === 'airteltigo' ||
    netLower === 'at'
  ) {
    if (atPrefixes.includes(prefix)) {
      return { isValid: true, normalizedPhone: clean, detectedNetwork: 'AirtelTigo' };
    }
    return {
      isValid: false,
      errorMessage: `Invalid AirtelTigo/AT number! Prefix '${prefix}' (${clean}) belongs to another network. AT prefixes are 027, 057, 026, 056.`,
    };
  }

  return { isValid: true, normalizedPhone: clean };
}
