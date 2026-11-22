import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp';

/** Floating "Chat on WhatsApp" (free wa.me link). Hidden until a real number is set. */
export function WhatsAppButton({ number, message }: { number?: string; message: string }) {
  const href = whatsappLink(number, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="ds-intro-late chamfer-sm fixed right-4 bottom-4 z-30 flex items-center gap-2 bg-[#25D366] px-4 py-3 font-heading text-sm font-semibold text-[#0a0a0a] shadow-lg transition-transform hover:-translate-y-0.5"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      <span className="max-sm:sr-only">Chat on WhatsApp</span>
    </a>
  );
}
