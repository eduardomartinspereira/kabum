'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/header.module.scss';

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cep, setCep] = useState('');

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCep(value);
  };

  return (
    <header className={styles.header}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderContent}>
          <div className={styles.logoSection}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoText}> <img src="https://static.kabum.com.br/conteudo/icons/logo.svg" alt="Logo" /></span>
              
            </Link>
          </div>

          <div className={styles.locationSection}>
            <span className={styles.locationIcon}>📍</span>
            <span className={styles.locationText}>Enviar para:</span>
            <input
              type="text"
              placeholder="Digite o CEP"
              value={cep}
              onChange={handleCepChange}
              className={styles.cepInput}
              maxLength={8}
            />
          </div>

          <div className={styles.searchSection}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Busque no ShopMaster!"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                <span className={styles.searchArrow}>➤</span>
              </button>
            </form>
          </div>

          <div className={styles.userSection}>
            {status === 'loading' ? (
              <div className={styles.loadingUser}>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : session ? (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  Olá, {session.user?.name || session.user?.email?.split('@')[0] || 'Usuário'}
                </span>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Sair
                </button>
              </div>
            ) : (
              <Link href="/" className={styles.loginButton}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className={styles.navigationBar}>
        <div className={styles.navContent}>
          <button className={styles.navButton}>
            Departamentos
            <span className={styles.chevron}>▼</span>
          </button>
          
          <button className={styles.navButton}>
            Cupons
          </button>
          
          <button className={styles.navButton}>
            Mais Vendidos
          </button>
          
          <button className={styles.navButton}>
            Venda no ShopMaster!
          </button>
          
          <button className={styles.navButton}>
            Hardware
          </button>
          
          <button className={styles.navButton}>
            PC Gamer
          </button>
          
          <button className={styles.navButton}>
            Computadores
          </button>
          
          <button className={styles.navButton}>
            Mais
            <span className={styles.chevron}>▼</span>
          </button>

          {/* Promotional Banner */}
          
        </div>
      </nav>
    </header>
  );
} 