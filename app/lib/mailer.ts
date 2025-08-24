/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/mailer.ts
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn('[mailer] Variáveis SMTP não configuradas. E-mails não serão enviados.');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: Number(SMTP_PORT) === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

type MailItem = { title: string; quantity: number; unit_price: number };
const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export async function sendPaymentConfirmationEmail(opts: {
  to: string;
  name?: string;
  orderId: string;
  amount: number;
  items?: MailItem[];
  receiptUrl?: string | null | undefined;
}) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return;

  const { to, name = 'Cliente', orderId, amount, items = [], receiptUrl } = opts;

  const itemsHtml = items.length
    ? `
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee">Item</th>
            <th style="text-align:center;padding:8px;border-bottom:1px solid #eee">Qtd</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #eee">Preço</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (i) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #f5f5f5">${i.title}</td>
              <td style="padding:8px;text-align:center;border-bottom:1px solid #f5f5f5">${i.quantity}</td>
              <td style="padding:8px;text-align:right;border-bottom:1px solid #f5f5f5">${brl(
                (i.unit_price || 0) * (i.quantity || 1)
              )}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`
    : '';

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px">
      <h2 style="margin:0 0 12px 0">Pagamento confirmado ✅</h2>
      <p style="margin:0 0 12px 0">Olá, <strong>${name}</strong>!</p>
      <p style="margin:0 0 12px 0">Recebemos o seu pagamento do pedido <strong>${orderId}</strong>.</p>
      ${itemsHtml}
      <p style="margin:12px 0 4px 0"><strong>Total:</strong> ${brl(amount)}</p>
      ${receiptUrl ? `<p style="margin:12px 0"><a href="${receiptUrl}" target="_blank">Ver comprovante</a></p>` : ''}
      <p style="margin-top:20px;color:#666;font-size:12px">
        Se você não reconhece esta compra, entre em contato com nosso suporte.
      </p>
    </div>`;

  return transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: `Pagamento confirmado – Pedido ${orderId}`,
    text: `Olá, ${name}. Seu pagamento do pedido ${orderId} foi confirmado. Total: ${brl(amount)}.`,
    html,
  });
}
