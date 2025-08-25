'use client';

import { useEffect, useState } from 'react';

interface PaymentStatusNotificationProps {
  status: string;
  paymentId: string;
  onClose?: () => void;
}

export function PaymentStatusNotification({ status, paymentId, onClose }: PaymentStatusNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (status === 'approved') {
      // Auto-hide após 5 segundos para pagamentos aprovados
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isVisible) return null;

  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          title: '🎉 Pagamento Aprovado!',
          message: 'Seu pagamento foi confirmado com sucesso!',
          bgColor: '#ecfdf5',
          borderColor: '#d1fae5',
          textColor: '#065f46',
          icon: '✅',
        };
      case 'pending':
        return {
          title: '⏳ Pagamento Pendente',
          message: 'Aguardando confirmação do pagamento...',
          bgColor: '#fefce8',
          borderColor: '#fde68a',
          textColor: '#92400e',
          icon: '⏳',
        };
      case 'in_process':
        return {
          title: '🔄 Pagamento em Processamento',
          message: 'Seu pagamento está sendo analisado...',
          bgColor: '#eff6ff',
          borderColor: '#bfdbfe',
          textColor: '#1e40af',
          icon: '🔄',
        };
      case 'rejected':
        return {
          title: '❌ Pagamento Rejeitado',
          message: 'Houve um problema com seu pagamento.',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          textColor: '#991b1b',
          icon: '❌',
        };
      default:
        return {
          title: '📋 Status do Pagamento',
          message: `Status atual: ${status}`,
          bgColor: '#f8fafc',
          borderColor: '#e2e8f0',
          textColor: '#475569',
          icon: '📋',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 50,
        maxWidth: '384px',
        width: '100%',
        backgroundColor: statusInfo.bgColor,
        border: `2px solid ${statusInfo.borderColor}`,
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flexShrink: 0, fontSize: '24px' }}>{statusInfo.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: statusInfo.textColor,
            margin: 0 
          }}>
            {statusInfo.title}
          </h3>
          <p style={{ 
            fontSize: '14px', 
            margin: '4px 0 0 0', 
            color: statusInfo.textColor, 
            opacity: 0.9 
          }}>
            {statusInfo.message}
          </p>
          {paymentId && (
            <p style={{ 
              fontSize: '12px', 
              margin: '8px 0 0 0', 
              color: '#64748b', 
              fontFamily: 'monospace' 
            }}>
              ID: {paymentId}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          style={{
            flexShrink: 0,
            color: '#9ca3af',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
