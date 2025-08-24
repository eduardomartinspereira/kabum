'use client';

import Script from 'next/script';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'ngext/navigation';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

type CardData = {
  token: string;
  issuerId?: number | string;       
  paymentMethodId: string;          // idem
  installments?: number | string;
};

function CreditCardCheckoutInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const amount = useMemo(() => Number(sp.get('amount') || 0), [sp]);
  const nameDefault = decodeURIComponent(sp.get('name') || 'Cliente');
  const emailDefault = decodeURIComponent(sp.get('email') || '');

  const [cpf, setCpf] = useState('');
  const cpfDigits = useMemo(() => cpf.replace(/\D/g, ''), [cpf]);

  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';
  const containerId = 'cardBrickContainer';
  const brickRef = useRef<{ destroy?: () => void } | null>(null);
  const submittingRef = useRef(false);

  
  useEffect(() => {
    if (!sdkReady) return;
    if (!window.MercadoPago) return;
    if (!PUBLIC_KEY) {
      setError('NEXT_PUBLIC_MP_PUBLIC_KEY não definida no .env');
      return;
    }
    if (cpfDigits.length !== 11) return;

    const mp = new window.MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
    const bricks = mp.bricks();

    bricks
      .create('cardPayment', containerId, {
        initialization: { amount },
        callbacks: {
          onReady: () => setError(null),
          onError: (err: unknown) =>
            setError(err instanceof Error ? err.message : 'Erro no Brick'),
          onSubmit: async (cardData: CardData) => {
            if (submittingRef.current) return; // evita duplo submit
            submittingRef.current = true;
            try {
              setSubmitting(true);
              setError(null);

              // ⛔️ NÃO envie issuer_id / payment_method_id (evita diff_param_bins)
              const body = {
                token: cardData.token,
                installments: Number(cardData.installments || 1),
                amount,
                description: 'Pedido na Loja',
                external_reference: `order_${Date.now()}`,
                payer: {
                  name: nameDefault,
                  email: emailDefault,
                  identification: { type: 'CPF', number: cpfDigits },
                },
              };

              const res = await fetch('/api/mercadopago/card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });

              // resposta pode não ser JSON em caso de erro
              let data: any = null;
              try { data = await res.json(); } 
              catch { data = { error: await res.text() }; }

              if (!res.ok) {
                throw new Error(data?.error || 'Falha ao processar pagamento');
              }

              // ✅ sem alert — redireciona pra página de sucesso
              router.replace(
                `/success?paymentId=${encodeURIComponent(data.id)}&status=${encodeURIComponent(
                  data.status || ''
                )}&ref=${encodeURIComponent(data.external_reference || '')}`
              );
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Erro ao enviar pagamento';
              setError(msg);
            } finally {
              submittingRef.current = false;
              setSubmitting(false);
            }
          },
        },
      })
      .then((b: { destroy?: () => void }) => {
        brickRef.current = b;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Falha ao criar o Brick');
      });

    // destruir o brick ao desmontar / alterar deps
    return () => {
      try {
        brickRef.current?.destroy?.();
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = '';
      } catch {}
    };
  }, [sdkReady, PUBLIC_KEY, amount, cpfDigits, nameDefault, emailDefault, router]);

  const canCreateBrick = sdkReady && cpfDigits.length === 11;

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setError('Não foi possível carregar o SDK do Mercado Pago')}
      />

      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 16,
          border: '1px solid #e5e7eb',
          padding: '6px 10px',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        Pagamento com Cartão
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Total: <strong>R$ {amount.toFixed(2).replace('.', ',')}</strong>
      </p>

      <div style={{ display: 'grid', gap: 12, maxWidth: 520, marginBottom: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>CPF do titular</span>
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 8 }}
            disabled={submitting}
          />
        </label>

        <div style={{ fontSize: 12, color: '#6b7280' }}>
          SDK: {sdkReady ? 'carregado' : 'carregando'} • Chave pública:{' '}
          {PUBLIC_KEY ? `${PUBLIC_KEY.slice(0, 6)}…${PUBLIC_KEY.slice(-4)}` : '—'}
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: 12,
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {!canCreateBrick ? (
        <div style={{ border: '1px dashed #e5e7eb', padding: 16, borderRadius: 8 }}>
          Informe um CPF válido para carregar o formulário do cartão.
        </div>
      ) : (
        <div id={containerId} style={{ minHeight: 320, opacity: submitting ? 0.6 : 1 }} />
      )}

      {submitting && <p style={{ marginTop: 12 }}>Enviando pagamento…</p>}
    </main>
  );
}

export default function CreditCardCheckoutPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Carregando…</main>}>
      <CreditCardCheckoutInner />
    </Suspense>
  );
}
