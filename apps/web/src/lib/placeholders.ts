import { whatsappLink } from './whatsapp';

/** Seed values the client hasn't filled in yet ("TBD", "TBD, Pakistan", ""). */
export const isSet = (v?: string | null): v is string => !!v && !/^\s*TBD\b/i.test(v);

/** A real phone number, not the "+92 300 0000000" placeholder. */
export const isRealPhone = (v?: string | null): v is string => whatsappLink(v) !== null;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
