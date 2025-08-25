'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import styles from '../../styles/checkout.module.scss';

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
  
  // Estados do cupom
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string>('');

  const unitPrice = useMemo(() => Number(variation?.price ?? 0), [variation?.price]);
  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const discountAmount = useMemo(() => couponData?.discountAmount || 0, [couponData]);
  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

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
        const res = await fetch(`/api/products/${productId}`, {
          signal: abort.signal,
          cache: 'no-store',
        });
        if (!res.ok) {
          setProduct(null);
          setVariation(null);
          return;
        }
        const data: Product = await res.json();
        let picked =
          data.variations?.find((v) => String(v.id) === String(variationId)) ?? null;

        // Se não encontrou a variação e é uma variação virtual (produtos sem variações)
        if (!picked && String(variationId).startsWith('virtual-')) {
          // Criar variação virtual baseada no produto para exibição
          picked = {
            id: variationId,
            size: 'Padrão',
            color: 'Padrão', 
            material: 'Padrão',
            price: (data as any).basePrice || 0,
            stock: 10, // Assumir estoque disponível
          };
        }

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

  // Função para validar cupom
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          amount: subtotal,
          productId: productId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCouponData(data);
        toast.success(`Cupom aplicado! Desconto de R$ ${data.discountAmount.toFixed(2)}`);
      } else {
        setCouponError(data.error || 'Erro ao validar cupom');
        setCouponData(null);
      }
    } catch (error) {
      setCouponError('Erro ao validar cupom');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Função para remover cupom
  const removeCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setCouponError('');
    toast.info('Cupom removido');
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
  const goToPayment = async (path: string) => {
    const name = session?.user?.name ?? 'Cliente';  
    const email = session?.user?.email ?? '';       
    const amount = Number(total.toFixed(2));        

    let finalVariationId = variationId;

    // Se for uma variação virtual, criar variação real primeiro
    if (String(variationId).startsWith('virtual-')) {
      try {
        const response = await fetch('/api/create-variation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId,
            size: 'Padrão',
            color: 'Padrão',
            material: 'Padrão',
            price: variation?.price || 0,
            stock: 10,
            sku: `${productId}-default-${Date.now()}`
          })
        });
        
        if (response.ok) {
          const newVariation = await response.json();
          finalVariationId = newVariation.id;
        } else {
          toast.error('Erro ao preparar produto para pagamento');
          return;
        }
      } catch (error) {
        toast.error('Erro ao preparar produto para pagamento');
        return;
      }
    }

    const params: Record<string, string> = {
      amount: String(amount),
      name,
      email,
      productId: String(productId ?? ''),
      variationId: String(finalVariationId ?? ''),
      qty: String(quantity),
      productName: product?.name || 'Produto selecionado',
    };

    // Adicionar dados do cupom se aplicado
    if (couponData) {
      params.couponCode = couponData.coupon.code;
      params.originalAmount = String(couponData.originalAmount);
      params.discountAmount = String(couponData.discountAmount);
    }

    const qs = new URLSearchParams(params).toString();

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
            
            {/* Seção de Cupom */}
            <div className={styles.couponSection}>
              <h3>Cupom de Desconto</h3>
              {!couponData ? (
                <div className={styles.couponInput}>
                  <div className={styles.couponInputGroup}>
                    <input
                      type="text"
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className={styles.couponField}
                      disabled={couponLoading}
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className={styles.couponButton}
                    >
                      {couponLoading ? 'Validando...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <div className={styles.couponError}>
                      {couponError}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.couponApplied}>
                  <div className={styles.couponInfo}>
                    <span className={styles.couponCode}>✅ {couponData.coupon.code}</span>
                    <span className={styles.couponDiscount}>
                      -{couponData.coupon.discountType === 'PERCENTAGE' 
                        ? `${couponData.coupon.discount}%` 
                        : `R$ ${couponData.coupon.discount.toFixed(2)}`}
                    </span>
                  </div>
                  <button onClick={removeCoupon} className={styles.removeCouponButton}>
                    Remover
                  </button>
                </div>
              )}
            </div>

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
              {couponData && (
                <div className={styles.summaryRow}>
                  <span style={{ color: '#059669' }}>Desconto ({couponData.coupon.code}):</span>
                  <span style={{ color: '#059669' }}>-R$ {brl(discountAmount)}</span>
                </div>
              )}
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
                onClick={() => goToPayment('/pixcheckout')}
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
                onClick={() => goToPayment('/creditcard')}
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
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          Carregando…
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
