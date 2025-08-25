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
  const [lastStatus, setLastStatus] = useState<string>('');

  const checkStatus = useCallback(async () => {
    if (!paymentId) return;

    console.log(`[HOOK] 🔍 Verificando status do pagamento: ${paymentId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payment-status?paymentId=${paymentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status');
      }

      const newStatus = data.status;
      console.log(`[HOOK] 📊 Status recebido: ${newStatus} (anterior: ${lastStatus})`);
      
      // Sempre atualizar o status atual
      setStatus(newStatus);
      
      // Verificar se houve mudança de status
      if (newStatus !== lastStatus) {
        console.log(`[HOOK] 🔄 Status mudou de "${lastStatus}" para "${newStatus}"`);
        setLastStatus(newStatus);
        onStatusChange?.(newStatus);

        if (newStatus === 'approved') {
          console.log(`[HOOK] 🎉 Pagamento aprovado! Chamando onApproved`);
          onApproved?.();
          setIsPolling(false);
        }
      } else {
        console.log(`[HOOK] ⏭️ Status não mudou: ${newStatus}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[HOOK] ❌ Erro ao verificar status do pagamento:', err);
    } finally {
      setLoading(false);
    }
  }, [paymentId, onStatusChange, onApproved, lastStatus]);

  const startPolling = useCallback(() => {
    if (!paymentId || !enabled) return;
    
    console.log(`[HOOK] 🚀 Iniciando polling para pagamento: ${paymentId}`);
    setIsPolling(true);
    
    // Verificação imediata
    checkStatus();
    
    const interval = setInterval(() => {
      if (!isPolling) {
        console.log(`[HOOK] ⏹️ Polling parado, limpando intervalo`);
        clearInterval(interval);
        return;
      }
      checkStatus();
    }, pollingInterval);

    return () => {
      console.log(`[HOOK] 🧹 Limpando intervalo de polling`);
      clearInterval(interval);
    };
  }, [paymentId, enabled, isPolling, checkStatus, pollingInterval]);

  const stopPolling = useCallback(() => {
    console.log(`[HOOK] ⏹️ Parando polling`);
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (enabled && paymentId) {
      console.log(`[HOOK] 🔌 Hook ativado para pagamento: ${paymentId}`);
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
