'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { reportsAPI, ordersAPI } from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '@/lib/utils';
import styles from './page.module.css';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryData, ordersData] = await Promise.all([
        reportsAPI.getSummary(),
        ordersAPI.getPending(),
      ]);
      setSummary(summaryData);
      setPendingOrders(ordersData.slice(0, 5)); // Show last 5
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <Link href="/orders/new" className="btn btn-primary">
            ➕ Nuevo Pedido
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card success">
            <p className="stat-label">Recaudación Hoy</p>
            <p className="stat-value">
              {summary ? formatCurrency(summary.today.total) : '-'}
            </p>
            <p className="stat-change text-muted">
              {summary?.today.orders_count || 0} pedidos
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Esta Semana</p>
            <p className="stat-value">
              {summary ? formatCurrency(summary.week.total) : '-'}
            </p>
            <p className="stat-change text-muted">
              {summary?.week.orders_count || 0} pedidos
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Este Mes</p>
            <p className="stat-value">
              {summary ? formatCurrency(summary.month.total) : '-'}
            </p>
            <p className="stat-change text-muted">
              {summary?.month.orders_count || 0} pedidos
            </p>
          </div>

          <div className="stat-card warning">
            <p className="stat-label">Pedidos Pendientes</p>
            <p className="stat-value">
              {summary?.pending_orders || 0}
            </p>
            <p className="stat-change text-muted">
              Por entregar
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="card mt-xl">
          <div className="card-header flex-between">
            <h2 className="card-title">Pedidos Pendientes</h2>
            <Link href="/orders?status=pendiente" className="btn btn-secondary btn-sm">
              Ver todos
            </Link>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">📋</p>
              <p>No hay pedidos pendientes</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Evento</th>
                    <th>Entrega</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer_name}</td>
                      <td>{formatDate(order.event_date)}</td>
                      <td>{formatDate(order.delivery_date)}</td>
                      <td className="price">{formatCurrency(order.total)}</td>
                      <td>
                        <div className="actions">
                          <Link
                            href={`/orders/${order.id}/edit`}
                            className="btn btn-secondary btn-sm"
                          >
                            Ver
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-4 mt-xl ${styles.quickActions}`}>
          <Link href="/orders/new" className={styles.actionCard}>
            <span className={styles.actionIcon}>➕</span>
            <span className={styles.actionLabel}>Nuevo Pedido</span>
          </Link>
          <Link href="/products" className={styles.actionCard}>
            <span className={styles.actionIcon}>📦</span>
            <span className={styles.actionLabel}>Productos</span>
          </Link>
          <Link href="/orders" className={styles.actionCard}>
            <span className={styles.actionIcon}>📋</span>
            <span className={styles.actionLabel}>Historial</span>
          </Link>
          <Link href="/reports" className={styles.actionCard}>
            <span className={styles.actionIcon}>📈</span>
            <span className={styles.actionLabel}>Reportes</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
