import { whatsappLink } from './whatsapp';

describe('whatsappLink', () => {
  it('builds a wa.me link from a formatted number with an encoded message', () => {
    expect(whatsappLink('+92 321-555 1234', "Hi, I'd like a squad & more")).toBe(
      "https://wa.me/923215551234?text=Hi%2C%20I'd%20like%20a%20squad%20%26%20more",
    );
  });

  it('omits ?text when no message', () => {
    expect(whatsappLink('+923215551234')).toBe('https://wa.me/923215551234');
  });

  it.each([undefined, null, '', 'TBD', '+92 300 0000000'])('returns null for %j', (n) => {
    expect(whatsappLink(n)).toBeNull();
  });
});
