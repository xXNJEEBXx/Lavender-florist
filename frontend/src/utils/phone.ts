export const normalizeSaudiPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Handle international prefix '+' or '00'
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
  
  // Remove Saudi country code if present
  if (cleaned.startsWith('966')) cleaned = cleaned.substring(3);
  
  // Add leading zero if missing
  if (cleaned.startsWith('5')) {
    cleaned = '0' + cleaned;
  }
  
  // Extract numbers only
  cleaned = cleaned.replace(/\D/g, '');
  
  return cleaned;
};
