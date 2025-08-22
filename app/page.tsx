'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../styles/page.module.scss';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.ok) {
            toast.success('Você foi logado com sucesso!');
            router.push('/eduardoTarefa');
        } else {
            toast.error('Usuário e senha inválidos!');
        }

        setPassword('');
        setEmail('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.centerBox}>
                <div className={styles.card}>
                    <div className={styles.logoContainer}>
                        <h1 className={styles.logo}><img src="/kirvanoLogo.png" /></h1>
                    </div>
                    
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="email" className={styles.label}>
                                E-mail
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder=""
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password" className={styles.label}>
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder=""
                            />
                        </div>

                        <div className={styles.rowRight}>
                            <a href="#" className={styles.linkPrimarySmall}>
                                Esqueceu sua senha?
                            </a>
                        </div>

                        <div className={styles.separator}>
                            <span className={styles.separatorText}>*</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.buttonPrimary}
                        >
                            {loading ? 'Acessando...' : 'Acessar minha conta'}
                        </button>
                    </form>
                </div>

                <div className={styles.registerLink}>
                    <span className={styles.registerText}>Não tem uma conta?</span>{' '}
                    <a href="#" className={styles.linkPrimary}>
                        Cadastre-se
                    </a>
                </div>
            </div>
        </div>
    );
}
