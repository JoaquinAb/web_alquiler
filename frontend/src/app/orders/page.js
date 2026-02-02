'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { ordersAPI } from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusText, ORDER_STATUSES } from '@/lib/utils';
import styles from './page.module.css';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('');

    // Cancel confirmation
    const [cancelConfirm, setCancelConfirm] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [statusFilter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const data = await ordersAPI.list(params);
            setOrders(data.results || data);
        } catch (err) {
            setError('Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatus = async (orderId, newStatus) => {
        try {
            await ordersAPI.changeStatus(orderId, newStatus);
            setSuccess('Estado actualizado');
            loadOrders();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Error al cambiar estado');
        }
    };

    const handleCancel = async (id) => {
        try {
            await ordersAPI.cancel(id);
            setCancelConfirm(null);
            setSuccess('Pedido cancelado');
            loadOrders();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Error al cancelar');
        }
    };

    const handleDownloadPDF = async (id) => {
        try {
            await ordersAPI.downloadPDF(id);
        } catch (err) {
            setError('Error al descargar PDF');
        }
    };

    const handlePrintPDF = async (id) => {
        try {
            await ordersAPI.printPDF(id);
        } catch (err) {
            setError('Error al imprimir PDF');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando pedidos...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Historial de Pedidos</h1>
                    <Link href="/orders/new" className="btn btn-primary">
                        ➕ Nuevo Pedido
                    </Link>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Filters */}
                <div className={styles.filters}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Todos los estados</option>
                        {ORDER_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                </div>

                {/* Orders Table */}
                {orders.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <p className="empty-state-icon">📋</p>
                            <p>No hay pedidos</p>
                            <Link href="/orders/new" className="btn btn-primary mt-md">
                                Crear primer pedido
                            </Link>
                        </div>
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
                                    <th>Estado</th>
                                    <th>Total</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>
                                            <strong>{order.customer_name}</strong>
                                            <br />
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {order.items_count} items
                                            </span>
                                        </td>
                                        <td>{formatDate(order.event_date)}</td>
                                        <td>{formatDate(order.delivery_date)}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="price">{formatCurrency(order.total)}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <Link
                                                    href={`/orders/${order.id}/edit`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    ✏️
                                                </Link>

                                                {order.status === 'pendiente' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleChangeStatus(order.id, 'entregado')}
                                                        title="Marcar como entregado"
                                                    >
                                                        ✓
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDownloadPDF(order.id)}
                                                    title="Descargar PDF"
                                                >
                                                    📄
                                                </button>

                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handlePrintPDF(order.id)}
                                                    title="Imprimir"
                                                >
                                                    🖨️
                                                </button>

                                                {order.status !== 'cancelado' && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => setCancelConfirm(order)}
                                                        title="Cancelar pedido"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Cancel Confirmation Modal */}
                {cancelConfirm && (
                    <div className="modal-overlay" onClick={() => setCancelConfirm(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Confirmar Cancelación</h3>
                                <button className="modal-close" onClick={() => setCancelConfirm(null)}>
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>¿Está seguro de cancelar el pedido <strong>#{cancelConfirm.id}</strong> de <strong>{cancelConfirm.customer_name}</strong>?</p>
                                <p className="text-muted mt-sm">El pedido no se contará en los reportes de recaudación.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setCancelConfirm(null)}
                                >
                                    Volver
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleCancel(cancelConfirm.id)}
                                >
                                    Cancelar Pedido
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
