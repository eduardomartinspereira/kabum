'use client';

import { useEffect, useState } from 'react';

interface PaymentSuccessModalProps {
  paymentId: string;
  externalReference: string;
  amount: number;
  onClose: () => void;
  onContinue: () => void;
}

export function PaymentSuccessModal({ 
  paymentId, 
  externalReference, 
  amount, 
  onClose, 
  onContinue 
}: PaymentSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    
    // Parar confete após 3 segundos
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      {/* Confete animado */}
      {showConfetti && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-10px',
                left: `${Math.random() * 100}%`,
                width: '8px',
                height: '8px',
                backgroundColor: ['#16a34a', '#22c55e', '#059669', '#10b981', '#34d399'][i % 5],
                borderRadius: '50%',
                animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Ícone de sucesso */}
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'bounce 0.6s ease-in-out',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 12.5l3 3 7-7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#065f46',
            margin: '0 0 12px 0',
          }}
        >
          🎉 Pagamento Aprovado!
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: '#047857',
            margin: '0 0 24px 0',
            lineHeight: 1.5,
          }}
        >
          Seu pagamento foi confirmado com sucesso! 
          Você receberá um e-mail de confirmação em instantes.
        </p>

        {/* Detalhes do pagamento */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            margin: '0 0 24px 0',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                VALOR PAGO
              </span>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#065f46' }}>
                R$ {amount.toFixed(2).replace('.', ',')}
              </div>
            </div>
            
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                ID DO PAGAMENTO
              </span>
              <div style={{ 
                fontSize: '14px', 
                fontFamily: 'monospace', 
                background: '#f1f5f9', 
                padding: '8px 12px', 
                borderRadius: '6px',
                color: '#334155'
              }}>
                {paymentId}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                REFERÊNCIA
              </span>
              <div style={{ 
                fontSize: '14px', 
                fontFamily: 'monospace', 
                background: '#f1f5f9', 
                padding: '8px 12px', 
                borderRadius: '6px',
                color: '#334155'
              }}>
                {externalReference}
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onContinue}
            style={{
              padding: '14px 24px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            Continuar Comprando
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '14px 24px',
              backgroundColor: '#ffffff',
              color: '#065f46',
              border: '1px solid #d1fae5',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdf4';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1fae5';
            }}
          >
            Fechar
          </button>
        </div>

        {/* Estilos CSS para animações */}
        <style jsx>{`
          @keyframes fall {
            0% {
              transform: translateY(-10px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0,-30px,0);
            }
            70% {
              transform: translate3d(0,-15px,0);
            }
            90% {
              transform: translate3d(0,-4px,0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
