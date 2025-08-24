'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const paymentId = sp.get('paymentId') ?? '';
  const status = (sp.get('status') ?? '').toLowerCase();
  const ref = sp.get('ref') ?? '';

  const approved = status === 'approved';

  // Pequena animação de "confete" (sem libs)
  useEffect(() => {
    if (!approved) return;
    const container = document.getElementById('confetti');
    if (!container) return;

    const qty = 60;
    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < qty; i++) {
      const s = document.createElement('span');
      s.className = 'piece';
      s.style.left = Math.random() * 100 + '%';
      s.style.background = [
        '#16a34a',
        '#22c55e',
        '#059669',
        '#10b981',
        '#34d399',
      ][i % 5];
      s.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      container.appendChild(s);
      nodes.push(s);
    }
    return () => nodes.forEach(n => n.remove());
  }, [approved]);

  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: 24 }}>
      <button
        onClick={() => router.push('/')}
        style={{
          marginBottom: 16,
          border: '1px solid #e5e7eb',
          padding: '6px 10px',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        ← Voltar para a loja
      </button>

      {approved ? (
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #d1fae5',
            background: '#ecfdf5',
            color: '#065f46',
            borderRadius: 16,
            padding: 28,
          }}
        >
          {/* Confete */}
          <div
            id="confetti"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          />
          <style jsx>{`
            .piece {
              position: absolute;
              top: -10px;
              width: 10px;
              height: 14px;
              opacity: 0.9;
              transform: translateY(-20px) rotate(0deg);
              animation: fall 1.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
            }
            @keyframes fall {
              0% {
                transform: translateY(-20px) rotate(0deg);
                opacity: 0.9;
              }
              100% {
                transform: translateY(120%) rotate(540deg);
                opacity: 0.2;
              }
            }
          `}</style>

          <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="12" cy="12" r="12" fill="#10b981" />
              <path
                d="M7 12.5l3 3 7-7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                Pagamento aprovado! 🎉
              </h1>
              <p style={{ margin: '4px 0 0', color: '#047857' }}>
                Recebemos seu pagamento com sucesso. Você receberá um e-mail de
                confirmação em instantes.
              </p>
            </div>
          </header>

          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 18,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              color: '#111827',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Payment ID</span>
              <code
                style={{
                  fontSize: 14,
                  background: '#f3f4f6',
                  padding: '6px 8px',
                  borderRadius: 8,
                }}
              >
                {paymentId || '—'}
              </code>
            </div>

            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Referência</span>
              <code
                style={{
                  fontSize: 14,
                  background: '#f3f4f6',
                  padding: '6px 8px',
                  borderRadius: 8,
                }}
              >
                {ref || '—'}
              </code>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 18,
            }}
          >
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #059669',
                background: '#10b981',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Ir para a página inicial
            </button>

            <button
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `Pagamento aprovado\nID: ${paymentId}\nRef: ${ref}`
                );
                alert('Copiado!');
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#065f46',
                fontWeight: 600,
              }}
            >
              Copiar detalhes
            </button>
          </div>
        </section>
      ) : (
        <section
          style={{
            border: '1px solid #e5e7eb',
            background: '#fff',
            borderRadius: 16,
            padding: 28,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            Status do pagamento
          </h1>
          <p style={{ color: '#6b7280', marginTop: 6 }}>
            Status recebido: <strong>{status || 'desconhecido'}</strong>
          </p>

          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 14,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Payment ID</span>
              <div style={{ fontFamily: 'monospace' }}>{paymentId || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Referência</span>
              <div style={{ fontFamily: 'monospace' }}>{ref || '—'}</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontWeight: 600,
              }}
            >
              Voltar para a loja
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Carregando…</main>}>
      <SuccessInner />
    </Suspense>
  );
}
