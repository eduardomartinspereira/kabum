// app/pix-checkout/page.tsx
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentStatusNotification } from '../components/PaymentStatusNotification';
import { PaymentSuccessModal } from '../components/PaymentSuccessModal';

type PixResp = {
  id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  external_reference: string;
};

export default function PixCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
          <p>Carregando dados do checkout…</p>
        </main>
      }
    >
      <PixCheckoutInner />
    </Suspense>
  );
}

function PixCheckoutInner() {
  const sp = useSearchParams();
  const router = useRouter();

  // valores vindos do checkout
  const amount = useMemo(() => Number(sp.get('amount') || 0), [sp]);
  const nameDefault = decodeURIComponent(sp.get('name') || 'Cliente');
  const emailDefault = decodeURIComponent(sp.get('email') || '');

  const [name, setName] = useState(nameDefault);
  const [email, setEmail] = useState(emailDefault);
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Hook para verificar status do pagamento
  const { status, loading: statusLoading, error: statusError } = usePaymentStatus({
    paymentId: pix?.id || null,
    enabled: !!pix?.id,
    onApproved: () => {
      setShowNotification(true);
      setShowSuccessModal(true);
      // Redirecionar para página de sucesso após 8 segundos (tempo para ver o modal)
      setTimeout(() => {
        router.push(`/success?paymentId=${pix?.id}&status=approved&ref=${pix?.external_reference}`);
      }, 8000);
    },
    onStatusChange: (newStatus) => {
      if (newStatus && newStatus !== 'pending') {
        setShowNotification(true);
      }
    },
  });

  async function gerarPix(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPix(null);
    setLoading(true);
    try {
      const res = await fetch('/api/pixpayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          cpf,
          amount, // número
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Falha (200) ao gerar PIX');
      }
      setPix(json.data as PixResp);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar PIX';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  // Mostrar notificação quando status mudar
  useEffect(() => {
    if (status && status !== 'pending') {
      setShowNotification(true);
    }
  }, [status]);

  const handleContinueShopping = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
      {/* Notificação de status */}
      {showNotification && pix?.id && status && (
        <PaymentStatusNotification
          status={status}
          paymentId={pix.id}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Modal de sucesso */}
      {showSuccessModal && pix && (
        <PaymentSuccessModal
          paymentId={pix.id}
          externalReference={pix.external_reference}
          amount={amount}
          onClose={handleCloseModal}
          onContinue={handleContinueShopping}
        />
      )}

      <button
        onClick={() => router.back()}
        style={{ marginBottom: 16, border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 8 }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pagamento via PIX</h1>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Total: <strong>R$ {amount.toFixed(2).replace('.', ',')}</strong>
      </p>

      {!pix && (
        <form onSubmit={gerarPix} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Nome completo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Seu nome"
              style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 8 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 8 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>CPF</span>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
              placeholder="000.000.000-00"
              style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 8 }}
            />
          </label>

          {err && (
            <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: 12, borderRadius: 8 }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#10b981',
              color: '#fff',
              padding: '12px 14px',
              borderRadius: 10,
              fontWeight: 600,
              border: 'none',
            }}
          >
            {loading ? 'Gerando PIX…' : `Gerar PIX – R$ ${amount.toFixed(2).replace('.', ',')}`}
          </button>
        </form>
      )}

      {pix && (
        <section style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>QR Code</h2>
          
          {/* Status do pagamento */}
          {status && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: status === 'approved' ? '#ecfdf5' : 
                         status === 'rejected' ? '#fef2f2' : 
                         status === 'in_process' ? '#eff6ff' : '#fefce8',
              border: `1px solid ${
                status === 'approved' ? '#d1fae5' : 
                status === 'rejected' ? '#fecaca' : 
                status === 'in_process' ? '#bfdbfe' : '#fde68a'
              }`,
              color: status === 'approved' ? '#065f46' : 
                     status === 'rejected' ? '#991b1b' : 
                     status === 'in_process' ? '#1e40af' : '#92400e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>
                  {status === 'approved' ? '✅' : 
                   status === 'rejected' ? '❌' : 
                   status === 'in_process' ? '🔄' : '⏳'}
                </span>
                <strong>
                  Status: {status === 'approved' ? 'Aprovado' : 
                          status === 'rejected' ? 'Rejeitado' : 
                          status === 'in_process' ? 'Em Processamento' : 
                          status === 'pending' ? 'Pendente' : status}
                </strong>
              </div>
              {statusLoading && (
                <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.8 }}>
                  Verificando status...
                </p>
              )}
              {statusError && (
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#dc2626' }}>
                  Erro ao verificar status: {statusError}
                </p>
              )}
            </div>
          )}

          {pix.qr_code_base64 ? (
            <img
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt="QR Code PIX"
              style={{ width: 260, height: 260, border: '1px solid #e5e7eb', borderRadius: 8 }}
            />
          ) : (
            <p>Copie o código abaixo no seu app do banco.</p>
          )}
          
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Código copia e cola</span>
            <textarea
              readOnly
              value={pix.qr_code}
              style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 8, minHeight: 100 }}
            />
          </label>
          
          <button
            onClick={() => navigator.clipboard.writeText(pix.qr_code || '')}
            style={{ border: '1px solid #e5e7eb', padding: '10px 12px', borderRadius: 8, width: 200 }}
          >
            Copiar código
          </button>

          {/* Instruções para o usuário */}
          <div style={{
            marginTop: 16,
            padding: 16,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 14,
            color: '#475569'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>📱 Como pagar:</h3>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Abra o app do seu banco</li>
              <li>Escolha a opção PIX</li>
              <li>Escaneie o QR Code ou cole o código copia e cola</li>
              <li>Confirme o pagamento</li>
              <li>Aguarde a confirmação automática</li>
            </ol>
            <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#64748b' }}>
              <strong>💡 Dica:</strong> O status será atualizado automaticamente. 
              Quando aprovado, você verá uma tela de confirmação e será redirecionado automaticamente.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
