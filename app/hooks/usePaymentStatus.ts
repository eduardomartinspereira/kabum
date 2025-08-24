import { useState, useEffect, useCallback } from 'react';

interface UsePaymentStatusProps {
  paymentId: string | null;
  onStatusChange?: (status: string) => void;
  onApproved?: () => void;
  pollingInterval?: number;
  enabled?: boolean;
}

export function usePaymentStatus({
  paymentId,
  onStatusChange,
  onApproved,
  pollingInterval = 3000, // 3 segundos
  enabled = true,
}: UsePaymentStatusProps) {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!paymentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payment-status?paymentId=${paymentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status');
      }

      const newStatus = data.status;
      setStatus(newStatus);
      onStatusChange?.(newStatus);

      if (newStatus === 'approved') {
        onApproved?.();
        setIsPolling(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('Erro ao verificar status do pagamento:', err);
    } finally {
      setLoading(false);
    }
  }, [paymentId, onStatusChange, onApproved]);

  const startPolling = useCallback(() => {
    if (!paymentId || !enabled) return;
    
    setIsPolling(true);
    checkStatus(); // Verificação imediata
    
    const interval = setInterval(() => {
      if (!isPolling) {
        clearInterval(interval);
        return;
      }
      checkStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [paymentId, enabled, isPolling, checkStatus, pollingInterval]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (enabled && paymentId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, paymentId, startPolling, stopPolling]);

  return {
    status,
    loading,
    error,
    isPolling,
    checkStatus,
    startPolling,
    stopPolling,
  };
}
