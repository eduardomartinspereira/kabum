'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Header from '../../components/Header';
import styles from './product.module.scss';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const productId = params.id;
  
  const [product, setProduct] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (response.ok) {
            const productData = await response.json();
            setProduct(productData);
            setSelectedVariation(productData.variations[0]);
          } else {
            toast.error('Produto não encontrado');
            router.push('/');
          }
        } catch (error) {
          toast.error('Erro ao carregar produto');
          router.push('/');
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [productId, router]);

  const handleAddToCart = () => {
    if (!session) {
      // Redirecionar para home com produto selecionado
      router.push(`/?selectedProduct=${productId}&selectedVariation=${selectedVariation?.id}`);
      return;
    }

    // Se já estiver logado, ir direto para checkout
    router.push(`/checkout?productId=${productId}&variationId=${selectedVariation?.id}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Header />
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.errorContainer}>
        <Header />
        <div className={styles.errorContent}>
          <h2>Produto não encontrado</h2>
          <p>O produto solicitado não foi encontrado.</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            Voltar à Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productPage}>
      <Header />
      
      <div className={styles.productContent}>
        <div className={styles.productGrid}>
          <div className={styles.productImage}>
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0].url} 
                alt={product.images[0].alt || product.name}
                className={styles.productImage}
              />
            ) : (
              <span className={styles.productIcon}>
                {product.category === 'Eletrônicos' ? '📱' : 
                 product.category === 'Calçados' ? '👟' : '🛍️'}
              </span>
            )}
          </div>
          
          <div className={styles.productDetails}>
            <h1 className={styles.productTitle}>{product.name}</h1>
            <p className={styles.productDescription}>{product.description}</p>
            
            <div className={styles.productMeta}>
              <span className={styles.brand}>Marca: {product.brand}</span>
              <span className={styles.category}>Categoria: {product.category}</span>
            </div>

            <div className={styles.variationsSection}>
              <h2>Variações Disponíveis:</h2>
              <div className={styles.variationsGrid}>
                {product.variations.map((variation: any) => (
                  <div 
                    key={variation.id}
                    className={`${styles.variationCard} ${selectedVariation?.id === variation.id ? styles.selectedVariation : ''}`}
                    onClick={() => setSelectedVariation(variation)}
                  >
                    <div className={styles.variationInfo}>
                      <span className={styles.variationSize}>{variation.size}</span>
                      <span className={styles.variationColor}>{variation.color}</span>
                      <span className={styles.variationMaterial}>{variation.material}</span>
                    </div>
                    <div className={styles.variationPrice}>
                      R$ {parseFloat(variation.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={styles.variationStock}>
                      Estoque: {variation.stock} unidades
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedVariation && (
              <div className={styles.selectedVariationInfo}>
                <div className={styles.priceSection}>
                  <span className={styles.priceLabel}>Preço:</span>
                  <span className={styles.priceValue}>
                    R$ {parseFloat(selectedVariation.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.installments}>
                  ou 10x de R$ {(parseFloat(selectedVariation.price) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className={styles.addToCartButton}
                  disabled={selectedVariation.stock === 0}
                >
                  {selectedVariation.stock === 0 ? 'Produto Indisponível' : 'Adicionar ao Carrinho'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 