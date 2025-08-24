/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/** ====== Credenciais ====== */
const MP_ACCESS_TOKEN =
  process.env.MERCADOPAGO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN || MP_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN') {
  console.warn('[MP] ⚠️ MERCADOPAGO_ACCESS_TOKEN não definido. Configure no .env');
}

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

/** ====== Helpers ====== */
/** URL do webhook: aceita somente HTTPS; ignora localhost */
function getNotificationUrl(): string | undefined {
  const raw = (process.env.MP_NOTIFICATION_URL || '').trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== 'https:') return undefined;
      return u.href;
    } catch {
      return undefined;
    }
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (base) {
    try {
      const u = new URL(base);
      if (
        u.protocol === 'https:' &&
        !['localhost', '127.0.0.1', '::1'].includes(u.hostname)
      ) {
        return `${u.origin}/api/webhook`;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

/** back_urls apenas se base HTTPS válida (ex.: ngrok) */
function getHttpsBackUrls():
  | { success: string; failure: string; pending: string }
  | undefined {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (!base) return undefined;
  try {
    const u = new URL(base);
    if (
      u.protocol === 'https:' &&
      !['localhost', '127.0.0.1', '::1'].includes(u.hostname)
    ) {
      return {
        success: `${u.origin}/success`,
        failure: `${u.origin}/failure`,
        pending: `${u.origin}/pending`,
      };
    }
  } catch {
    // ignore
  }
  return undefined;
}

/** ====== Tipos ====== */
export interface PaymentData {
  name: string;
  email: string;
  cpf: string;
  amount: number;
}

export interface PixPaymentResponse {
  id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  external_reference: string;
}

/** ====== Serviço ====== */
export class MercadoPagoService {
  /** ==== PIX ==== */
  async createPixPayment(paymentData: PaymentData): Promise<PixPaymentResponse> {
    try {
      const notificationUrl = getNotificationUrl();
      const backUrls = getHttpsBackUrls(); // só HTTPS
      console.log('[MP] notificationUrl (PIX):', notificationUrl);
      console.log('[MP] back_urls (PIX):', backUrls);

      const externalReference = `order_${Date.now()}`;
      const amountNum = Number(paymentData.amount);

      // Para Preference.items o SDK exige `id`
      const prefItems = [
        {
          id: 'DIGITAL-1',
          title: 'Produto Digital',
          description: 'Acesso completo ao conteúdo',
          quantity: 1,
          unit_price: amountNum,
          currency_id: 'BRL',
        },
      ];

      const [firstName, ...rest] = paymentData.name.trim().split(' ');
      const lastName = rest.join(' ');

      // 1) Preferência — sem auto_return e SEM additional_info (no SDK pode exigir string)
      const preferenceClient = new Preference(client);
      await preferenceClient.create({
        body: {
          items: prefItems as any,
          payer: {
            name: paymentData.name,
            email: paymentData.email,
            identification: {
              type: 'CPF',
              number: paymentData.cpf.replace(/\D/g, ''),
            },
          },
          ...(backUrls ? { back_urls: backUrls } : {}),
          ...(notificationUrl ? { notification_url: notificationUrl } : {}),
          external_reference: externalReference,
          metadata: {
            buyer_email: paymentData.email,
            order_id: externalReference,
            customer_name: paymentData.name,
          },
          payment_methods: {
            excluded_payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' },
              { id: 'bank_transfer' },
            ],
            installments: 1,
          },
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      // 2) Pagamento PIX
      const paymentClient = new Payment(client);
      const pixResponse = await paymentClient.create({
        body: {
          transaction_amount: amountNum,
          description: 'Produto Digital - Acesso completo ao conteúdo',
          payment_method_id: 'pix',
          payer: {
            email: paymentData.email, // e-mail fica aqui (nível superior)
            first_name: firstName || paymentData.name,
            last_name: lastName || '',
            identification: {
              type: 'CPF',
              number: paymentData.cpf.replace(/\D/g, ''),
            },
          },
          external_reference: externalReference,
          ...(notificationUrl ? { notification_url: notificationUrl } : {}),
          metadata: {
            buyer_email: paymentData.email,
            order_id: externalReference,
            customer_name: paymentData.name,
          },
          // Aqui o SDK aceita objeto AdditionalInfo
          additional_info: {
            items: [
              {
                id: 'DIGITAL-1',
                title: 'Produto Digital',
                quantity: 1,
                unit_price: amountNum,
              },
            ],
            payer: {
              first_name: firstName || paymentData.name,
              last_name: lastName || '',
            },
          } as any,
        },
      });

      return {
        id: String(pixResponse.id),
        status: pixResponse.status || '',
        qr_code: pixResponse.point_of_interaction?.transaction_data?.qr_code || '',
        qr_code_base64:
          pixResponse.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        external_reference: externalReference,
      };
    } catch (error: any) {
      console.error('Erro ao criar pagamento PIX:', error);
      throw (error?.cause ? error : new Error('Falha ao processar pagamento PIX'));
    }
  }

  /** ==== CARTÃO ==== */
  // Observação: aceitamos issuer_id/payment_method_id no tipo para compatibilidade,
  // mas NÃO os enviamos ao MP para evitar diff_param_bins. O MP deduz pelo token.
  async createCardPayment(args: {
    token: string;
    issuer_id?: string;              // ignorado
    payment_method_id?: string;      // ignorado
    installments?: number;
    amount: number;
    description?: string;
    external_reference?: string;
    payer: {
      email: string;
      identification: { type: 'CPF' | 'CNPJ'; number: string };
      name?: string;
    };
  }) {
    try {
      const notificationUrl = getNotificationUrl();
      console.log('[MP] notificationUrl (CARD):', notificationUrl);

      const externalRef = args.external_reference || `order_${Date.now()}`;
      const amountNum = Number(args.amount);

      const fullName =
        (args.payer as any)?.name && String((args.payer as any).name).trim()
          ? String((args.payer as any).name).trim()
          : undefined;
      const [firstName, ...rest] = (fullName || '').split(' ');
      const lastName = rest.join(' ');

      const paymentClient = new Payment(client);
      const resp = await paymentClient.create({
        body: {
          token: args.token,
          // NÃO enviar issuer_id nem payment_method_id para evitar diff_param_bins
          transaction_amount: amountNum,
          installments: Number(args.installments || 1),
          description: args.description || 'Pagamento com cartão',
          external_reference: externalRef,
          capture: true,
          payer: {
            email: args.payer.email,
            identification: {
              type: args.payer.identification.type,
              number: args.payer.identification.number.replace(/\D/g, ''),
            },
          },
          ...(notificationUrl ? { notification_url: notificationUrl } : {}),
          metadata: {
            buyer_email: args.payer.email,
            order_id: externalRef,
            ...(fullName ? { customer_name: fullName } : {}),
          },
          additional_info: {
            payer: fullName
              ? {
                  first_name: firstName || fullName,
                  last_name: lastName || '',
                }
              : {},
          } as any,
        },
      });

      return resp;
    } catch (error: any) {
      console.error('Erro ao criar pagamento com cartão:', error);
      throw (error?.cause ? error : new Error('Falha ao processar pagamento com cartão'));
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const paymentClient = new Payment(client);
      const response = await paymentClient.get({ id: paymentId });
      return response.status || '';
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }

  /** Detalhes expandidos (inclui metadata/additional_info para o webhook) */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const paymentClient = new Payment(client);
      const response = await paymentClient.get({ id: paymentId });
      return {
        id: response.id,
        status: response.status,
        status_detail: (response as any).status_detail,
        external_reference: response.external_reference,
        transaction_amount: response.transaction_amount,
        description: response.description,
        payment_method_id: response.payment_method_id,
        date_created: response.date_created,
        date_last_updated: response.date_last_updated,
        payer: response.payer,
        additional_info: (response as any).additional_info,
        metadata: (response as any).metadata,
        order: (response as any).order,
        point_of_interaction: response.point_of_interaction,
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes do pagamento:', error);
      throw new Error('Falha ao buscar detalhes do pagamento');
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
