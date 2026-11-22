// @vitest-environment node
import { server } from '@/mocks/node';
import { checkFile, MAX_BYTES, mimeOf, uploadFile } from './uploads';

const file = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

describe('upload checks', () => {
  it('accepts pdf/doc/docx, using the extension when the browser gives no type', () => {
    expect(mimeOf(file('tor.pdf', 'application/pdf'))).toBe('application/pdf');
    expect(mimeOf(file('jd.docx', ''))).toMatch(/wordprocessingml/);
    expect(mimeOf(file('jd.DOC', ''))).toBe('application/msword');
    expect(mimeOf(file('photo.png', 'image/png'))).toBeNull();
  });

  it('rejects wrong types, empty and oversized files', () => {
    expect(checkFile(file('tor.pdf', 'application/pdf'))).toBeNull();
    expect(checkFile(file('x.exe', 'application/octet-stream'))).toMatch(/only PDF/);
    expect(checkFile(file('e.pdf', 'application/pdf', 0))).toMatch(/empty/);
    const big = file('big.pdf', 'application/pdf', 1);
    Object.defineProperty(big, 'size', { value: MAX_BYTES + 1 });
    expect(checkFile(big)).toMatch(/larger than/);
  });

  it('presigns then PUTs, returning the storage key', async () => {
    const key = await uploadFile(file('Terms of Reference.pdf', 'application/pdf'));
    expect(key).toMatch(/^uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}-Terms_of_Reference\.pdf$/);
  });
});
