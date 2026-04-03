/**
 * Formats a phone string as the user types.
 * - Preserves a leading '+' (or adds one if the user starts with digits)
 * - NANP (+1): formats as  +1 XXX XXX XXXX
 * - Other:      groups remaining digits in blocks of 3
 * - Caps at 15 digits (E.164 max)
 */
export function formatPhone(input: string): string {
  if (!input) return "";

  // Allow '+' only at position 0; strip everything else that isn't a digit
  const hasPlus = input.startsWith("+");
  const digits = input.replace(/\D/g, "").slice(0, 15);

  if (!digits) return hasPlus ? "+" : "";

  // North American (+1 XXX XXX XXXX)
  if (digits.startsWith("1")) {
    const local = digits.slice(1);
    const parts: string[] = ["+1"];
    if (local.length > 0) parts.push(local.slice(0, 3));
    if (local.length > 3) parts.push(local.slice(3, 6));
    if (local.length > 6) parts.push(local.slice(6, 10));
    return parts.join(" ");
  }

  // International: '+' then groups of 3
  const groups = digits.match(/.{1,3}/g) ?? [];
  return "+" + groups.join(" ");
}

/**
 * Returns true if the value contains between 7 and 15 digits (E.164 range).
 */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
