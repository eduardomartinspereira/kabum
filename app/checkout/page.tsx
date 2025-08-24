'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import styles from './checkout.module.scss';

type Variation = {
  id: number | string;
  size: string;
  color: string;
  material: string;
  price: number | string;
  stock: number;
};

type Product = {
  id: number | string;
  name: string;
  description: string;
  variations: Variation[];
  images?: { url: string; alt?: string }[];
};

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CheckoutInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get('productId') ?? undefined;
  const variationId = searchParams.get('variationId') ?? undefined;

  const [product, setProduct] = useState<Product | null>(null);
  const [variation, setVariation] = useState<Variation | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const unitPrice = useMemo(() => Number(variation?.price ?? 0), [variation?.price]);
  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const total = subtotal;

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }

    if (!productId || !variationId) {
      setLoading(false);
      return;
    }

    const abort = new AbortController();
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`, { signal: abort.signal });
        if (!res.ok) {
          setProduct(null);
          setVariation(null);
          return;
        }
        const data: Product = await res.json();
        const picked =
          data.variations?.find((v) => String(v.id) === String(variationId)) ?? null;

        setProduct(picked ? data : null);
        setVariation(picked ?? null);

        if (picked && picked.stock > 0) {
          setQuantity((q) => Math.min(Math.max(1, q), picked.stock));
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.error('Erro ao buscar produto:', err);
          setProduct(null);
          setVariation(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => abort.abort();
  }, [status, productId, variationId, router]);

  const handleQuantityChange = (newQty: number) => {
    if (!variation) return;
    const clamped = Math.min(Math.max(1, newQty), Math.max(1, variation.stock));
    setQuantity(clamped);
  };

  // Abre o modal de opções
  const handleCheckout = () => {
    if (!variation || !product) return;
    if (variation.stock <= 0) {
      toast.error('Este item está sem estoque.');
      return;
    }
    setShowPaymentOptions(true);
  };

  // Redireciona para a rota escolhida levando os dados necessários
  const goToPayment = (path: string) => {
    const name = encodeURIComponent(session?.user?.name ?? 'Cliente');
    const email = encodeURIComponent(session?.user?.email ?? '');
    const amount = Number(total.toFixed(2)); // garante número com 2 casas

    const qs = new URLSearchParams({
      amount: String(amount),
      name,
      email,
      productId: String(productId ?? ''),
      variationId: String(variationId ?? ''),
      qty: String(quantity),
    }).toString();

    router.push(`${path}?${qs}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Carregando checkout…</p>
      </div>
    );
  }

  if (!product || !variation) {
    return (
      <div className={styles.errorContainer}>
        <h2>Produto não encontrado</h2>
        <p>O produto ou a variação selecionada não foi encontrada.</p>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          Voltar à Loja
        </button>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <Header />

      <div className={styles.checkoutContent}>
        <header className={styles.checkoutHeader}>
          <h1>Finalizar Compra</h1>
          <p>Revise seus dados e confirme a compra</p>
        </header>

        {session && (
          <div className={styles.userInfoSection}>
            <h2>Informações do Usuário</h2>
            <div className={styles.userInfoCard}>
              <div className={styles.userInfoRow}>
                <span className={styles.userInfoLabel}>Nome:</span>
                <span className={styles.userInfoValue}>
                  {session.user?.name || 'Não informado'}
                </span>
              </div>
              <div className={styles.userInfoRow}>
                <span className={styles.userInfoLabel}>Email:</span>
                <span className={styles.userInfoValue}>
                  {session.user?.email || 'Não informado'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.checkoutGrid}>
          <div className={styles.productSummary}>
            <h2>Resumo do Produto</h2>
            <div className={styles.productCard}>
              <div className={styles.productImage}>
                <img
                  src={product.images?.[0]?.url || '/placeholder.png'}
                  alt={product.images?.[0]?.alt || product.name || 'Produto'}
                  className={styles.productImage}
                />
              </div>

              <div className={styles.productDetails}>
                <h3>{product.name}</h3>
                <p className={styles.productDescription}>{product.description}</p>

                <div className={styles.variationDetails}>
                  <span className={styles.variationTag}>Tamanho: {variation.size}</span>
                  <span className={styles.variationTag}>Cor: {variation.color}</span>
                  <span className={styles.variationTag}>Material: {variation.material}</span>
                </div>

                <div className={styles.quantitySelector}>
                  <label>Quantidade:</label>
                  <div className={styles.quantityControls}>
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className={styles.quantityButton}
                      aria-label="Diminuir quantidade"
                    >
                      –
                    </button>
                    <span className={styles.quantityValue}>{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= variation.stock}
                      className={styles.quantityButton}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.stockInfo}>
                    {variation.stock > 0 ? `Estoque: ${variation.stock} unidades` : 'Sem estoque'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.orderSummary}>
            <h2>Resumo da Compra</h2>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span>Produto:</span>
                <span>{product.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Variação:</span>
                <span>
                  {variation.size} — {variation.color}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Preço unitário:</span>
                <span>R$ {brl(unitPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Quantidade:</span>
                <span>{quantity}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>R$ {brl(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Frete:</span>
                <span>Grátis</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span className={styles.totalLabel}>Total:</span>
                <span className={styles.totalValue}>R$ {brl(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className={styles.checkoutButton}
              disabled={variation.stock <= 0 || quantity > variation.stock}
            >
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>

      {/* ===== Modal de opções de pagamento ===== */}
      {showPaymentOptions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Escolher método de pagamento"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowPaymentOptions(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              Escolha o método de pagamento
            </h3>
            <p style={{ marginTop: 6, color: '#6b7280' }}>
              Total a pagar: <strong>R$ {brl(total)}</strong>
            </p>

            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => goToPayment('/pix-checkout')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '2px solid #10b981',
                  background: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: 600,
                }}
              >
                Pagar com PIX
              </button>

              <button
                onClick={() => goToPayment('/credit-card')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '2px solid #3b82f6',
                  background: '#eff6ff',
                  color: '#1e3a8a',
                  fontWeight: 600,
                }}
              >
                Pagar com Cartão de Crédito
              </button>
            </div>

            <button
              onClick={() => setShowPaymentOptions(false)}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  // ✅ Envolve quem usa useSearchParams com Suspense para evitar o erro de CSR bailout
  return (
    <Suspense fallback={<div className={styles.loadingContainer}><div className={styles.loadingSpinner} />Carregando…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
