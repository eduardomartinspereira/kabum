// app/pix-checkout/page.tsx
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentStatusNotification } from '../components/PaymentStatusNotification';
import { PaymentSuccessModal } from '../components/PaymentSuccessModal';
import Header from '../components/Header';

type PixResp = {
  id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  external_reference: string;
};

export default function PixCheckoutPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
            <p>Carregando dados do checkout…</p>
          </main>
        }
      >
        <PixCheckoutInner />
      </Suspense>
      <footer style={{ 
        background: '#f3f4f6', 
        padding: '20px', 
        textAlign: 'center', 
        borderTop: '1px solid #e5e7eb',
        marginTop: '40px'
      }}>
        <p>&copy; 2025 ShopMaster. Todos os direitos reservados.</p>
      </footer>
    </>
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
      console.log('[PIX-PAGE] 🎉 onApproved chamado! Mostrando modal e notificação');
      setShowNotification(true);
      setShowSuccessModal(true);
      // Redirecionar para página de sucesso após 8 segundos (tempo para ver o modal)
      setTimeout(() => {
        console.log('[PIX-PAGE] 🔄 Redirecionando para página de sucesso');
        router.push(`/success?paymentId=${pix?.id}&status=approved&ref=${pix?.external_reference}`);
      }, 8000);
    },
    onStatusChange: (newStatus) => {
      console.log(`[PIX-PAGE] 🔄 Status mudou para: ${newStatus}`);
      if (newStatus && newStatus !== 'pending') {
        console.log(`[PIX-PAGE] 📢 Mostrando notificação para status: ${newStatus}`);
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
      console.log('[PIX-PAGE] ✅ PIX gerado com sucesso:', json.data);
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
    console.log(`[PIX-PAGE] 📊 Status atual: ${status}`);
    if (status && status !== 'pending') {
      console.log(`[PIX-PAGE] 📢 Status não é pending, mostrando notificação`);
      setShowNotification(true);
    }
  }, [status]);

  // Debug: mostrar quando o modal de sucesso deve aparecer
  useEffect(() => {
    if (showSuccessModal) {
      console.log('[PIX-PAGE] 🎭 Modal de sucesso ativado');
    }
  }, [showSuccessModal]);

  // Debug: logar quando o PIX é definido
  useEffect(() => {
    if (pix?.id) {
      console.log(`[PIX-PAGE] 🆔 PIX definido com ID: ${pix.id}`);
    }
  }, [pix?.id]);

  const handleContinueShopping = () => {
    console.log('[PIX-PAGE] 🛒 Usuário clicou em continuar comprando');
    setShowSuccessModal(false);
    router.push('/');
  };

  const handleCloseModal = () => {
    console.log('[PIX-PAGE] ❌ Usuário fechou o modal');
    setShowSuccessModal(false);
  };

  return (
    <main style={{ 
      maxWidth: 920, 
      margin: '0 auto', 
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: 'calc(100vh - 200px)'
    }}>
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
        style={{ 
          marginBottom: 16, 
          border: '1px solid #e5e7eb', 
          padding: '6px 10px', 
          borderRadius: 8,
          alignSelf: 'flex-start'
        }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Pagamento via PIX</h1>
      <p style={{ color: '#6b7280', marginBottom: 16, textAlign: 'center' }}>
        Total: <strong>R$ {amount.toFixed(2).replace('.', ',')}</strong>
      </p>

      {!pix && (
        <form onSubmit={gerarPix} style={{ 
          display: 'grid', 
          gap: 12, 
          maxWidth: 520,
          width: '100%'
        }}>
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
        <section style={{ 
          marginTop: 24, 
          display: 'grid', 
          gap: 12,
          maxWidth: 520,
          width: '100%',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>QR Code</h2>
          
          {pix.qr_code_base64 ? (
            <img
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt="QR Code PIX"
              style={{ width: 260, height: 260, border: '1px solid #e5e7eb', borderRadius: 8, margin: '0 auto' }}
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
            style={{ border: '1px solid #e5e7eb', padding: '10px 12px', borderRadius: 8, width: 200, margin: '0 auto' }}
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
