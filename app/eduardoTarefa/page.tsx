import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import LogoutButton from '../components/LogoutButton';
import styles from '../../styles/checkout.module.scss';

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
    const userId = (session.user as { id?: string | number } | undefined)?.id ?? null;
    const role = (session.user as { role?: string } | undefined)?.role ?? null;

    const displayName = name ?? email ?? 'usuário';

    return (
        <main className={styles.container}>
            <section className={styles.card}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Bem-vindo ao seu painel</h1>
                    <p className={styles.subtitle}>
                        Olá, <strong>{displayName}</strong>! Você entrou com sucesso.
                    </p>
                </header>

                <div className={styles.profileRow}>
                    <div className={styles.avatar} aria-hidden>
                        {getInitials(name ?? email)}
                    </div>
                    <div className={styles.profileMeta}>
                        <div className={styles.profileName}>{name ?? 'Sem nome'}</div>
                        {email && <div className={styles.profileEmail}>{email}</div>}
                    </div>
                </div>

                <dl className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                        <dt>Nome</dt>
                        <dd>{name ?? '—'}</dd>
                    </div>
                    <div className={styles.dataItem}>
                        <dt>E-mail</dt>
                        <dd>{email ?? '—'}</dd>
                    </div>
                    <div className={styles.dataItem}>
                        <dt>ID do usuário</dt>
                        <dd>{userId ?? '—'}</dd>
                    </div>
                    <div className={styles.dataItem}>
                        <dt>Papel</dt>
                        <dd>{role ?? '—'}</dd>
                    </div>
                </dl>

                <div className={styles.actions}>
                    <LogoutButton className={styles.logoutBtn} />
                </div>
            </section>
        </main>
    );
}
