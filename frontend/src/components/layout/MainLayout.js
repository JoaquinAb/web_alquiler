'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import styles from './MainLayout.module.css';

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default function MainLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const data = await authAPI.getCurrentUser();
            setUser(data.user);
        } catch (error) {
            // Not authenticated, redirect to login
            if (pathname !== '/login') {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Cargando...</p>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user && pathname !== '/login') {
        return null;
    }

    // Login page doesn't need layout
    if (pathname === '/login') {
        return children;
    }

    return (
        <AuthContext.Provider value={{ user, setUser, checkAuth }}>
            <div className={styles.layout}>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <Navbar
                    user={user}
                    onLogout={handleLogout}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className={styles.main}>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </AuthContext.Provider>
    );
}
