'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import styles from '../../styles/search.module.scss';

// Tipos mínimos p/ evitar "any"
type Variation = { price: number | string };
type ProductImage = { url: string; alt?: string };
type Product = {
  id: string | number;
  name: string;
  description: string;
  brand?: string;
  category: string;
  images?: ProductImage[];
  variations: Variation[];
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    const searchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) return;

        const allProducts: Product[] = await response.json();

        // Filtrar produtos baseado na busca
        const q = query.toLowerCase();
        const filtered = allProducts.filter((product) => {
          const name = product.name?.toLowerCase() || '';
          const desc = product.description?.toLowerCase() || '';
          const brand = product.brand?.toLowerCase() || '';
          const cat = product.category?.toLowerCase() || '';
          return (
            name.includes(q) ||
            desc.includes(q) ||
            brand.includes(q) ||
            cat.includes(q)
          );
        });

        setProducts(filtered);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
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
          <p>
            Buscando por: <strong>{query}</strong>
          </p>
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
              const prices = (product.variations ?? [])
                .map((v) => Number(v.price))
                .filter((n) => Number.isFinite(n));
              const minPrice = prices.length ? Math.min(...prices) : 0;
              const maxPrice = prices.length ? Math.max(...prices) : 0;

              const priceRange =
                minPrice === maxPrice
                  ? `R$ ${minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `R$ ${minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

              return (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    {product.images && product.images.length > 0 ? (
                      // Se quiser sumir com o warning, troque por next/image e configure domains no next.config.js
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        className={styles.productImage}
                      />
                    ) : (
                      <span className={styles.productIcon}>
                        {product.category === 'Eletrônicos'
                          ? '📱'
                          : product.category === 'Calçados'
                          ? '👟'
                          : '🛍️'}
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
                        ou 10x de R$ {(minPrice / 10).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => (window.location.href = `/product/${product.id}`)}
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

export default function SearchPage() {
  // ✅ Ao envolver o componente que usa useSearchParams com Suspense,
  // evitamos o erro "useSearchParams() should be wrapped in a suspense boundary".
  return (
    <Suspense fallback={<div className={styles.searchContent}>Carregando…</div>}>
      <SearchContent />
    </Suspense>
  );
}
