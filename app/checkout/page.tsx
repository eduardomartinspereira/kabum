'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import styles from './checkout.module.scss';

// ===== TIPOS =====
type Variation = {
  id: number | string;
  size: string;
  color: string;
  material: string;
  price: number | string; // se vier string do backend, tratamos ao usar
  stock: number;
};

type Product = {
  id: number | string;
  name: string;
  description: string;
  variations: Variation[];
  images?: { url: string; alt?: string }[];
};

// ===== COMPONENTE =====
export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get('productId');
  const variationId = searchParams.get('variationId');

  const [product, setProduct] = useState<Product | null>(null);
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Buscar dados do produto do banco
    const fetchProduct = async () => {
      if (!productId || !variationId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const productData: Product = await response.json();

        // Encontrar a variação selecionada
        const variationData =
          productData.variations?.find(
            (v) => String(v.id) === String(variationId)
          ) || null;

        if (productData && variationData) {
          setProduct(productData);
          setVariation(variationData);
        } else {
          setProduct(null);
          setVariation(null);
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [status, productId, variationId, router]);

  const handleQuantityChange = (newQuantity: number) => {
    if (!variation) return;
    if (newQuantity >= 1 && newQuantity <= variation.stock) {
      setQuantity(newQuantity);
    }
  };

  const unitPrice = Number(variation?.price ?? 0);

  const calculateSubtotal = (): number => {
    return unitPrice * quantity;
  };

  const calculateTotal = (): number => {
    // Se houver frete/impostos, some aqui
    return calculateSubtotal();
  };

  const handleCheckout = () => {
    // Sua lógica de finalização de compra
    toast.success('Compra finalizada com sucesso!');
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Carregando checkout...</p>
      </div>
    );
  }

  if (!product || !variation) {
    return (
      <div className={styles.errorContainer}>
        <h2>Produto não encontrado</h2>
        <p>O produto ou variação selecionada não foi encontrada.</p>
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

        {/* Informações do Usuário */}
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
          {/* Resumo do Produto */}
          <div className={styles.productSummary}>
            <h2>Resumo do Produto</h2>
            <div className={styles.productCard}>
              <div className={styles.productImage}>
              <img
                src={product?.images?.[0]?.url || '/placeholder.png'}
                alt={product?.images?.[0]?.alt || product?.name || 'Produto'}
                className={styles.productImage}/>
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
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= variation.stock}
                      className={styles.quantityButton}
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.stockInfo}>Estoque: {variation.stock} unidades</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo da Compra */}
          <div className={styles.orderSummary}>
            <h2>Resumo da Compra</h2>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span>Produto:</span>
                <span>{product.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Variação:</span>
                <span>{variation.size} - {variation.color}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Preço unitário:</span>
                <span>
                  R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Quantidade:</span>
                <span>{quantity}</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>
                  R$ {calculateSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Frete:</span>
                <span>Grátis</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryRow}>
                <span className={styles.totalLabel}>Total:</span>
                <span className={styles.totalValue}>
                  R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className={styles.checkoutButton}
              disabled={quantity > variation.stock}
            >
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
