export function isSameHex(
  hex1: string | null | undefined,
  hex2: string | null | undefined
) {
  if (!hex1 || !hex2) return false;
  const hex1Without0x = hex1.replace('0x', '');
  const hex2Without0x = hex2.replace('0x', '');
  return hex1Without0x.toLowerCase() === hex2Without0x.toLowerCase();
}
