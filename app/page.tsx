/* eslint-disable  @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Header from './components/header';
import styles from '../styles/page.module.scss';

export default function ProductShowcase() {
  const router = useRouter();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<{ productId?: number; variationId?: number } | null>(null);

  // Estado do carrossel
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 1;

  // Funções de controle do carrossel
  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      if (prev === totalSlides - 1) {
        return 0; // Volta ao primeiro slide
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      if (prev === 0) {
        return totalSlides - 1; // Vai para o último slide
      }
      return prev - 1;
    });
  };

  // Auto-play do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [currentSlide]);

  const handleViewProduct = (product: any) => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (productId?: number, variationId?: number) => {
    setSelectedProduct({ productId, variationId });
    setShowLoginPopup(true);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      toast.success('Login realizado com sucesso!');
      setShowLoginPopup(false);
      // Redirecionar para checkout com dados do produto selecionado
      const productId = selectedProduct?.productId || 1;
      const variationId = selectedProduct?.variationId || 1;
      router.push(`/checkout?productId=${productId}&variationId=${variationId}`);
    } else {
      toast.error('Email ou senha inválidos!');
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          cpf,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsLoginMode(true);
        // Limpar campos
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setCpf('');
        setPhone('');
      } else {
        toast.error(data.error || 'Erro ao realizar cadastro');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // Limpar campos ao alternar
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setCpf('');
    setPhone('');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const productId = selectedProduct?.productId || 1;
    const variationId = selectedProduct?.variationId || 1;
    await signIn('google', { callbackUrl: `/checkout?productId=${productId}&variationId=${variationId}` });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Verificar se há produto selecionado na URL (vindo da página de produto)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedProductId = urlParams.get('selectedProduct');
    const selectedVariationId = urlParams.get('selectedVariation');

    if (selectedProductId && selectedVariationId) {
      setSelectedProduct({
        productId: parseInt(selectedProductId),
        variationId: parseInt(selectedVariationId),
      });
      setShowLoginPopup(true);

      // Limpar os parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className={styles.container}>
      <Header />

      {/* Hero Section - Carrossel de Banners */}
      <div className={styles.carouselContainer}>
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
                      <div className={styles.carouselSlide}>
              <img 
                src="https://themes.kabum.com.br/conteudo/layout/6873/1755351139.gif"
                alt="Banner promocional 1"
                className={styles.carouselImage}
              />
            </div>
            <div className={styles.carouselSlide}>
              <img 
                src="https://themes.kabum.com.br/conteudo/layout/6873/1755351139.gif"
                alt="Banner promocional 2"
                className={styles.carouselImage}
              />
            </div>
        </div>

                  {/* Indicadores de navegação */}
         

        {/* Botões de navegação */}

      </div>

      {/* Seção de Produtos */}
      <main className={styles.mainContent}>
        <section className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>Nossos Produtos</h2>

          {loadingProducts ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Carregando produtos...</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {products.map((product) => {
                // === NOVO BLOCO: preço base sem price range ===
                const variationPrices: number[] = (product?.variations ?? [])
                  .map((v: any) => Number(v.price))
                  .filter((n: number) => Number.isFinite(n) && n >= 0);

                const basePrice: number =
                  variationPrices.length
                    ? Math.min(...variationPrices)
                    : Number(product?.price ?? 0);

                const hasPrice = Number.isFinite(basePrice) && basePrice > 0;
                const displayPrice = hasPrice
                  ? `R$ ${basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Preço indisponível';
                // ==============================================

                return (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.productImageContainer}>
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
                        <span className={styles.price}>{displayPrice}</span>
                        {hasPrice && (
                          <span className={styles.installments}>
                            ou 10x de R$ {(basePrice / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewProduct(product)}
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
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.storeFooter}>
        <div className={styles.footerContent}>
          <p>&copy; 2025 ShopMaster. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Popup de Login */}
      {showLoginPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowLoginPopup(false)}>
          <div className={styles.loginPopup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>{isLoginMode ? 'Faça login para continuar' : 'Crie sua conta'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowLoginPopup(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.popupContent}>
              {isLoginMode && (
                <div className={styles.oauthButtons}>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className={styles.oauthButton}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Entrar com Google
                  </button>
                </div>
              )}

              {isLoginMode && (
                <div className={styles.separator}>
                  <span>ou</span>
                </div>
              )}

              <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
                {!isLoginMode && (
                  <>
                    <div className={styles.formRow}>
                      <div className={styles.formField}>
                        <label htmlFor="firstName">Nome</label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          placeholder="Seu nome"
                        />
                      </div>

                      <div className={styles.formField}>
                        <label htmlFor="lastName">Sobrenome</label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          placeholder="Seu sobrenome"
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formField}>
                        <label htmlFor="cpf">CPF</label>
                        <input
                          id="cpf"
                          type="text"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          required
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div className={styles.formField}>
                        <label htmlFor="phone">Telefone</label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.formField}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Seu email"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="password">Senha</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Sua senha"
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (isLoginMode ? 'Entrando...' : 'Cadastrando...') : (isLoginMode ? 'Entrar' : 'Cadastrar')}
                </button>
              </form>

              <div className={styles.modeToggle}>
                <span>
                  {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={styles.toggleButton}
                >
                  {isLoginMode ? 'Cadastre-se' : 'Fazer login'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
