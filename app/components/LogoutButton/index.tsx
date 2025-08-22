'use client';

import { signOut } from 'next-auth/react';
import React, { ButtonHTMLAttributes } from 'react';

export default function LogoutButton(
    { className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>
) {
    return (
        <button
            {...props}
            className={className}
            onClick={() => signOut({ callbackUrl: '/' })}
        >
            Sair
        </button>
    );
}
