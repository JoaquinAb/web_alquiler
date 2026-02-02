'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();

    const menuItems = [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/products', label: 'Productos', icon: '📦' },
        { href: '/orders', label: 'Pedidos', icon: '📋' },
        { href: '/orders/new', label: 'Nuevo Pedido', icon: '➕' },
        { href: '/reports', label: 'Reportes', icon: '📈' },
    ];

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={onClose} />}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🍽️</span>
                    <span className={styles.logoText}>Alquileres "El Grillo"</span>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            onClick={onClose}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <p className={styles.footerText}>© 2024 Alquiler Vajillas</p>
                </div>
            </aside>
        </>
    );
}
