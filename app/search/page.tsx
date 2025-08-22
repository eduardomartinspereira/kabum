'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import styles from './search.module.scss';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      const searchProducts = async () => {
        try {
          const response = await fetch('/api/products');
          if (response.ok) {
            const allProducts = await response.json();
            
            // Filtrar produtos baseado na busca
            const filteredProducts = allProducts.filter((product: any) => 
              product.name.toLowerCase().includes(query.toLowerCase()) ||
              product.description.toLowerCase().includes(query.toLowerCase()) ||
              product.brand?.toLowerCase().includes(query.toLowerCase()) ||
              product.category.toLowerCase().includes(query.toLowerCase())
            );
            
            setProducts(filteredProducts);
          }
        } catch (error) {
          console.error('Erro ao buscar produtos:', error);
        } finally {
          setLoading(false);
        }
      };

      searchProducts();
    }
  }, [query]);

  if (!query) {
    return (
      <div className={styles.searchPage}>
        <Header />
        <div className={styles.searchContent}>
          <h1>Busca inválida</h1>
          <p>Nenhum termo de busca fornecido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.searchPage}>
      <Header />
      
      <div className={styles.searchContent}>
        <div className={styles.searchHeader}>
          <h1>Resultados da busca</h1>
          <p>Buscando por: <strong>"{query}"</strong></p>
          <p className={styles.resultsCount}>
            {loading ? 'Carregando...' : `${products.length} produto(s) encontrado(s)`}
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Buscando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.noResults}>
            <h2>Nenhum produto encontrado</h2>
            <p>Tente usar termos diferentes ou verificar a ortografia.</p>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((product) => {
              const minPrice = Math.min(...product.variations.map((v: any) => parseFloat(v.price)));
              const maxPrice = Math.max(...product.variations.map((v: any) => parseFloat(v.price)));
              const priceRange = minPrice === maxPrice 
                ? `R$ ${minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : `R$ ${minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

              return (
                <div key={product.id} className={styles.productCard}>
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
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productDescription}>{product.description}</p>
                    <div className={styles.productMeta}>
                      <span className={styles.brand}>{product.brand}</span>
                      <span className={styles.category}>{product.category}</span>
                    </div>
                    <div className={styles.productPrice}>
                      <span className={styles.price}>{priceRange}</span>
                      <span className={styles.installments}>
                        ou 10x de R$ {(minPrice / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button 
                      onClick={() => window.location.href = `/product/${product.id}`}
                      className={styles.viewProductButton}
                    >
                      Ver Produto
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 