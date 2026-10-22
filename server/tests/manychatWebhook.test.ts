import { tieneBearerValido } from '../api/manychat-webhook';

describe('tieneBearerValido', () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('rechaza todo si no hay MANYCHAT_WEBHOOK_SECRET configurado', () => {
    delete process.env.MANYCHAT_WEBHOOK_SECRET;
    expect(tieneBearerValido('Bearer ')).toBe(false);
  });

  it('acepta solo el Bearer exacto', () => {
    process.env.MANYCHAT_WEBHOOK_SECRET = 'abc123';
    expect(tieneBearerValido('Bearer abc123')).toBe(true);
    expect(tieneBearerValido('Bearer abc124')).toBe(false);
    expect(tieneBearerValido(undefined)).toBe(false);
  });
});
