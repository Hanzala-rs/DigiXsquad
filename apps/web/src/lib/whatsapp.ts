/**
 * Free WhatsApp click-to-chat link (no API, zero cost). Returns null when the number is
 * missing or still a placeholder (e.g. "+92 300 0000000") so callers can hide the button.
 */
export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  const digits = (number ?? '').replace(/\D/g, '');
  if (digits.length < 7 || /0{6,}$/.test(digits)) return null;
  const url = `https://wa.me/${digits}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
