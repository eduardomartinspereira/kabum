// components/checkout-form.tsx
'use client';

import { useState } from 'react';
import { QrCode, CreditCard } from 'lucide-react';

type PixPayment = {
  id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  external_reference: string;
};

export function CheckoutForm() {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixPayment | null>(null);

  const submitPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pixpayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, cpf, amount: 2.0 }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao gerar PIX');
      setPix(data.data);
    } catch (err) {
      alert((err as Error).message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  if (pix) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Pagamento PIX</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <h2 className="font-medium mb-2">Resumo</h2>
            <p className="text-sm text-gray-600">Produto Digital — R$ 2,00</p>
          </div>
          <div className="border rounded p-4">
            <h2 className="font-medium mb-4">Escaneie o QR Code</h2>
            {pix.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${pix.qr_code_base64}`}
                alt="PIX QRCode"
                className="w-64 h-64 object-contain mx-auto"
              />
            ) : (
              <textarea className="w-full h-40 text-xs" readOnly value={pix.qr_code} />
            )}
            <button
              className="mt-4 w-full rounded bg-gray-100 px-3 py-2 text-sm"
              onClick={() => navigator.clipboard.writeText(pix.qr_code)}
            >
              Copiar código PIX
            </button>
            <button
              className="mt-2 w-full rounded bg-black text-white px-3 py-2 text-sm"
              onClick={() => (window.location.href = '/checkout')}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Finalizar Compra</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Resumo do Pedido</h2>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded bg-gray-100" />
            <div>
              <p className="font-medium">Produto Digital</p>
              <p className="text-sm text-gray-500">Acesso completo ao conteúdo</p>
            </div>
          </div>
          <div className="mt-4 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ 2,00</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa:</span>
              <span>R$ 0,00</span>
            </div>
            <div className="flex justify-between font-semibold mt-2">
              <span>Total:</span>
              <span>R$ 2,00</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod('pix')}
              className={`p-2 rounded border ${method === 'pix' ? 'border-black' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2 justify-center">
                <QrCode className="w-4 h-4" /> PIX
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`p-2 rounded border ${method === 'card' ? 'border-black' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2 justify-center">
                <CreditCard className="w-4 h-4" /> Cartão
              </div>
            </button>
          </div>
        </div>

        {method === 'pix' ? (
          <form onSubmit={submitPix} className="border rounded p-4 space-y-3">
            <h2 className="font-medium mb-1">Dados do Comprador</h2>
            <label className="text-sm">
              Nome Completo*
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              E-mail*
              <input
                type="email"
                className="mt-1 w-full rounded border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              CPF*
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </label>

            <button
              disabled={loading}
              className="mt-2 w-full rounded bg-black text-white px-3 py-2"
            >
              {loading ? 'Gerando PIX…' : 'Gerar PIX - R$ 2,00'}
            </button>
          </form>
        ) : (
          <div className="border rounded p-4">
            <p className="text-sm mb-3">
              Você será redirecionado para a página de cartão.
            </p>
            <button
              className="w-full rounded bg-black text-white px-3 py-2"
              onClick={() => (window.location.href = '/creditcard')}
            >
              Ir para Cartão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
