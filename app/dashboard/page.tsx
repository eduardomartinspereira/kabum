import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';
import LogoutButton from '../components/logoutbutton/index';



import styles from '../../styles/dashboard.module.scss';
import { authOptions } from '../lib/auth';

function getInitials(nameOrEmail?: string | null) {
    if (!nameOrEmail) return 'U';
    const safe = nameOrEmail.trim();
    const parts = safe.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    const base = safe.includes('@') ? safe.split('@')[0] : safe;
    return base.slice(0, 2).toUpperCase();
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/');
    }

    const name = session.user?.name ?? null;
    const email = session.user?.email ?? null;
    const userId = (session.user as { id?: string | number } | undefined)?.id;
    const displayName = name ?? email?.split('@')[0] ?? 'Usuário';

    // Verificar se userId existe antes de fazer queries
   

    // if (userId && !isNaN(Number(userId))) {
    //     const userIdNumber = Number(userId);
        
       
        

        
    // }

    // Dados padrão caso não existam no banco
    const defaultFinancialData = {
        saldoTotal: 0,
        receitas: 0,
        despesas: 0,
        investimentos: 0,
        metaMensal: 0,
        progressoMeta: 0,
    };

    
    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.welcome}>
                        <div className={styles.welcomeHeader}>
                            <div className={styles.storeLogo}>
                                <span className={styles.storeIcon}>🛒</span>
                                <span className={styles.storeName}>ShopMaster</span>
                            </div>
                            <h1>Olá, {displayName}!</h1>
                        </div>
                        <p>Aqui está um resumo das suas vendas</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.profile}>
                            <div className={styles.avatar}>
                                {getInitials(name ?? email)}
                            </div>
                            <span>{displayName}</span>
                        </div>
                        <LogoutButton className={styles.logoutBtn} />
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <main className={styles.content}>
                {/* Cards de Resumo */}
                <section className={styles.summaryCards}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Vendas Totais</h3>
                            <span className={styles.iconBalance}>💰</span>
                        </div>
                        
                        <div className={styles.cardChange}>+12.5% este mês</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Faturamento</h3>
                            <span className={styles.iconIncome}>📈</span>
                        </div>
                        
                        <div className={styles.cardChange}>+8.2% este mês</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Custos</h3>
                            <span className={styles.iconExpense}>📉</span>
                        </div>
                        
                        <div className={`${styles.cardChange} ${styles.negative}`}>-3.1% este mês</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Produtos</h3>
                            <span className={styles.iconInvestment}>📦</span>
                        </div>
                        
                        <div className={styles.cardChange}>+15.7% este mês</div>
                    </div>
                </section>

                {/* Gráficos e Detalhes */}

            </main>
        </div>
    );
}
