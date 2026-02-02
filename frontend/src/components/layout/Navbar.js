'use client';

import styles from './Navbar.module.css';

export default function Navbar({ user, onLogout, onMenuClick }) {
    return (
        <header className={styles.navbar}>
            <button className={styles.menuButton} onClick={onMenuClick}>
                ☰
            </button>

            <div className={styles.title}>
                Sistema de Alquiler
            </div>

            <div className={styles.user}>
                {user && (
                    <>
                        <span className={styles.userName}>
                            👤 {user.first_name || user.username}
                        </span>
                        <button className={styles.logoutBtn} onClick={onLogout}>
                            Cerrar Sesión
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
