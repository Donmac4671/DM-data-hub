import { DataPackage } from '../types';

/**
 * Intelligent Data Package Search Matching
 * Supports searching by:
 * - Network Name: "MTN", "Telecel", "AT", "AirtelTigo", "Vodafone", "iShare", "Big Time"
 * - Package Plan / Data Amount: "1GB", "1 GB", "2GB", "500MB", "10GB", "25GB"
 * - Validity / Features: "90 Days", "60 Days", "Non-Expiry", "Special"
 * - Multi-word combined queries: "MTN 1GB", "Telecel 5GB", "AT 10GB iShare"
 */
export function matchDataPackage(pkg: DataPackage, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;

  const query = rawQuery.trim().toLowerCase();
  const terms = query.split(/\s+/);

  // Normalized package fields
  const nameLower = pkg.name.toLowerCase();
  const nameNorm = nameLower.replace(/(\d+)\s*(gb|mb)/gi, '$1$2');
  const dataAmountNorm = pkg.dataAmount.toLowerCase().replace(/\s+/g, '');
  const networkLower = pkg.network.toLowerCase();
  const validityLower = (pkg.validity || '').toLowerCase();
  const descriptionLower = (pkg.description || '').toLowerCase();

  // Network Aliases
  const netAliases: string[] = [networkLower];
  if (networkLower === 'mtn') {
    netAliases.push('mtn', 'mtn ghana', 'yellow');
  } else if (networkLower === 'telecel') {
    netAliases.push('telecel', 'telecel ghana', 'vodafone', 'voda', 'red');
  } else if (networkLower.includes('airteltigo') || networkLower.includes('at')) {
    netAliases.push('airteltigo', 'at', 'airtel', 'tigo', 'at ishare', 'at bigtime', 'ishare', 'bigtime', 'blue');
  }

  return terms.every(term => {
    const cleanTerm = term.replace(/\s+/g, '');

    // Check network alias match
    if (netAliases.some(alias => alias.includes(cleanTerm) || cleanTerm.includes(alias))) {
      return true;
    }

    // Check data amount normalized (e.g., "1gb" or "2gb")
    if (dataAmountNorm.includes(cleanTerm) || nameNorm.includes(cleanTerm)) {
      return true;
    }

    // Check name, validity, description, price
    if (nameLower.includes(term)) return true;
    if (validityLower.includes(term)) return true;
    if (descriptionLower.includes(term)) return true;
    if (pkg.price.toString().includes(term)) return true;

    return false;
  });
}
