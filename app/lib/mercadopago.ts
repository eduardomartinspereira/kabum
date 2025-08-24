// lib/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const MP_ACCESS_TOKEN =
  process.env.MERCADOPAGO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN || MP_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN') {
  console.warn('[MP] ⚠️ MERCADOPAGO_ACCESS_TOKEN não definido. Configure no .env');
}

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

/** Resolve e valida a URL de webhook. Só aceita HTTPS e ignora localhost. */
function getNotificationUrl(): string | undefined {
  const rawEnv = (process.env.MP_NOTIFICATION_URL || '').trim();
  if (rawEnv) {
    try {
      const u = new URL(rawEnv);
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
        u.hostname !== 'localhost' &&
        u.hostname !== '127.0.0.1' &&
        u.hostname !== '::1'
      ) {
        return `${u.origin}/api/webhook`;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

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

export class MercadoPagoService {
  /** ==== PIX ==== */
  async createPixPayment(paymentData: PaymentData): Promise<PixPaymentResponse> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const notificationUrl = getNotificationUrl();
      console.log('[MP] notificationUrl (PIX):', notificationUrl);

      const externalReference = `order_${Date.now()}`;

      const items = [
        {
          title: 'Produto Digital',
          description: 'Acesso completo ao conteúdo',
          quantity: 1,
          unit_price: Number(paymentData.amount),
          currency_id: 'BRL',
        },
      ];

      const [firstName, ...rest] = paymentData.name.trim().split(' ');
      const lastName = rest.join(' ');

      // 1) Preferência (necessária para back_urls quando usar auto_return)
      const preferenceClient = new Preference(client);
      await preferenceClient.create({
        body: {
          items,
          payer: {
            name: paymentData.name,
            email: paymentData.email,
            identification: {
              type: 'CPF',
              number: paymentData.cpf.replace(/\D/g, ''),
            },
          },
          metadata: {
            buyer_email: paymentData.email,
            order_id: externalReference,
            customer_name: paymentData.name,
          },
          additional_info: {
            items: items.map(i => ({
              title: i.title,
              quantity: i.quantity,
              unit_price: i.unit_price,
            })),
            // **não** mande additional_info.payer.email (o MP rejeita)
            payer: {
              first_name: firstName || paymentData.name,
              last_name: lastName || '',
            },
          },
          payment_methods: {
            excluded_payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' },
              { id: 'bank_transfer' },
            ],
            installments: 1,
          },
          back_urls: {
            success: `${baseUrl}/success`,
            failure: `${baseUrl}/failure`,
            pending: `${baseUrl}/pending`,
          },
          ...(notificationUrl ? { notification_url: notificationUrl } : {}),
          auto_return: 'approved',
          external_reference: externalReference,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      // 2) Pagamento PIX
      const paymentClient = new Payment(client);
      const pixResponse = await paymentClient.create({
        body: {
          transaction_amount: Number(paymentData.amount),
          description: 'Produto Digital - Acesso completo ao conteúdo',
          payment_method_id: 'pix',
          payer: {
            email: paymentData.email,
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
          additional_info: {
            items: items.map(i => ({
              title: i.title,
              quantity: i.quantity,
              unit_price: i.unit_price,
            })),
            payer: {
              first_name: firstName || paymentData.name,
              last_name: lastName || '',
            },
          },
        },
      });

      return {
        id: String(pixResponse.id),
        status: pixResponse.status,
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
  async createCardPayment(args: {
    token: string;
    issuer_id?: string;
    payment_method_id: string;
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
          issuer_id: args.issuer_id,
          payment_method_id: args.payment_method_id,
          transaction_amount: Number(args.amount),
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
            payer: {
              email: args.payer.email,
              ...(fullName
                ? {
                    first_name: firstName || fullName,
                    last_name: lastName || '',
                  }
                : {}),
            },
          },
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
      return response.status;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }

  /** Detalhes expandidos para o webhook */
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
