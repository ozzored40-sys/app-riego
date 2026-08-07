import type { VercelRequest } from '@vercel/node';
import { tieneAutorizacionValida } from '../lib/auth';

function fakeRequest(headers: Record<string, string | undefined>): VercelRequest {
  return { headers } as unknown as VercelRequest;
}

describe('tieneAutorizacionValida', () => {
  const ORIGINAL_ENV = process.env.APP_SHARED_SECRET;

  afterEach(() => {
    process.env.APP_SHARED_SECRET = ORIGINAL_ENV;
  });

  it('rechaza si el servidor no tiene el secreto configurado', () => {
    delete process.env.APP_SHARED_SECRET;
    expect(tieneAutorizacionValida(fakeRequest({ 'x-chaman-app-key': 'algo' }))).toBe(false);
  });

  it('rechaza si el header no coincide', () => {
    process.env.APP_SHARED_SECRET = 'secreto-correcto';
    expect(tieneAutorizacionValida(fakeRequest({ 'x-chaman-app-key': 'otro-valor' }))).toBe(false);
  });

  it('rechaza si falta el header', () => {
    process.env.APP_SHARED_SECRET = 'secreto-correcto';
    expect(tieneAutorizacionValida(fakeRequest({}))).toBe(false);
  });

  it('acepta cuando el header coincide con el secreto', () => {
    process.env.APP_SHARED_SECRET = 'secreto-correcto';
    expect(tieneAutorizacionValida(fakeRequest({ 'x-chaman-app-key': 'secreto-correcto' }))).toBe(
      true,
    );
  });
});
