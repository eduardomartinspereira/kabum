// app/pix-checkout/page.tsx
'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
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
      toast.success('📱 PIX gerado com sucesso! Escaneie o QR Code ou copie o código.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar PIX';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

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
          
          {/* Informações do pedido */}
          <div style={{ 
            marginTop: 20,
            padding: '16px',
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>
              📦 Resumo do Pedido
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Produto:</span>
                <span style={{ fontWeight: 500 }}>{sp.get('productName') || 'Produto selecionado'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Quantidade:</span>
                <span style={{ fontWeight: 500 }}>{sp.get('qty') || '1'} unidade(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total:</span>
                <span style={{ fontWeight: 700, color: '#065f46' }}>
                  R$ {amount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
