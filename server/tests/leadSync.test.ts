import {
  debeAlertar,
  enviarAlertaLead,
  pestanaParaNivel,
  sincronizarLeadEnSheets,
  textoAlertaLead,
} from '../lib/leadSync';
import type { RegistroLead } from '../lib/leadSync';

const LEAD_CALIENTE: RegistroLead = {
  telefono: '5213320967184',
  canal: 'whatsapp',
  nombre: 'Juan Pérez',
  cultivo: 'papaya',
  necesidad: 'Fertilizante para 20 ha',
  nivel: 'N3',
};

describe('debeAlertar', () => {
  it('alerta al entrar a N3/N4 o subir de N3 a N4', () => {
    expect(debeAlertar(null, 'N3')).toBe(true);
    expect(debeAlertar('N2', 'N4')).toBe(true);
    expect(debeAlertar('N3', 'N4')).toBe(true);
  });

  it('no alerta en niveles fríos ni si ya era caliente', () => {
    expect(debeAlertar(null, 'N2')).toBe(false);
    expect(debeAlertar('N3', 'N3')).toBe(false);
    expect(debeAlertar('N4', 'N3')).toBe(false);
  });
});

describe('pestanaParaNivel', () => {
  it('N1/N2 van a nutrición y N3/N4 a calificados', () => {
    expect(pestanaParaNivel({ nivel: 'N1' })).toBe('Nutricion_Leads');
    expect(pestanaParaNivel({ nivel: 'N4' })).toBe('Leads_Calificados');
  });
});

describe('sincronizarLeadEnSheets', () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('no hace nada si no hay LEADS_SHEETS_WEBHOOK_URL', async () => {
    delete process.env.LEADS_SHEETS_WEBHOOK_URL;
    const fetchFalso = jest.fn();
    await sincronizarLeadEnSheets(LEAD_CALIENTE, fetchFalso);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('manda el lead con pestaña, estado y secreto al Apps Script', async () => {
    process.env.LEADS_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/x/exec';
    process.env.LEADS_SHEETS_SECRET = 'secreto';
    const fetchFalso = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await sincronizarLeadEnSheets(LEAD_CALIENTE, fetchFalso);

    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://script.google.com/macros/s/x/exec');
    expect(JSON.parse(opciones.body)).toMatchObject({
      secreto: 'secreto',
      pestana: 'Leads_Calificados',
      estado: 'Pendiente Contacto',
      telefono: '5213320967184',
      nivel: 'N3',
      empresa: '',
    });
  });

  it('lanza error si el Apps Script rechaza el lead', async () => {
    process.env.LEADS_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/x/exec';
    const fetchFalso = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: false, error: 'No autorizado' }),
      });
    await expect(sincronizarLeadEnSheets(LEAD_CALIENTE, fetchFalso)).rejects.toThrow(
      'No autorizado',
    );
  });
});

describe('enviarAlertaLead', () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('manda a Slack y a Telegram cuando ambos están configurados', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/x';
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    process.env.TELEGRAM_CHAT_ID = '-100';
    const fetchFalso = jest.fn().mockResolvedValue({ ok: true });

    await enviarAlertaLead(LEAD_CALIENTE, fetchFalso);

    const urls = fetchFalso.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      'https://hooks.slack.com/services/x',
      'https://api.telegram.org/botbot-token/sendMessage',
    ]);
  });

  it('el texto incluye nivel, teléfono con + y el SLA', () => {
    const texto = textoAlertaLead(LEAD_CALIENTE);
    expect(texto).toContain('Lead N3 por WhatsApp');
    expect(texto).toContain('Teléfono: +5213320967184');
    expect(texto).toContain('menos de 2 horas');
    expect(textoAlertaLead({ ...LEAD_CALIENTE, nivel: 'N4' })).toContain('menos de 15 minutos');
  });
});
