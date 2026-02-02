'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { reportsAPI } from '@/lib/api';
import { formatCurrency, formatDate, getCurrentDate } from '@/lib/utils';
import styles from './page.module.css';

export default function ReportsPage() {
    const [reportType, setReportType] = useState('summary');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Summary data
    const [summary, setSummary] = useState(null);

    // Detailed report data
    const [report, setReport] = useState(null);

    // Date filters
    const [customStartDate, setCustomStartDate] = useState(getCurrentDate());
    const [customEndDate, setCustomEndDate] = useState(getCurrentDate());

    useEffect(() => {
        loadSummary();
    }, []);

    useEffect(() => {
        if (reportType !== 'summary') {
            loadReport();
        }
    }, [reportType]);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const data = await reportsAPI.getSummary();
            setSummary(data);
        } catch (err) {
            setError('Error al cargar resumen');
        } finally {
            setLoading(false);
        }
    };

    const loadReport = async () => {
        try {
            setLoading(true);
            setError('');
            let data;

            switch (reportType) {
                case 'daily':
                    data = await reportsAPI.getDaily();
                    break;
                case 'weekly':
                    data = await reportsAPI.getWeekly();
                    break;
                case 'monthly':
                    data = await reportsAPI.getMonthly();
                    break;
                case 'custom':
                    data = await reportsAPI.getCustom(customStartDate, customEndDate);
                    break;
                default:
                    return;
            }

            setReport(data);
        } catch (err) {
            setError(err.message || 'Error al cargar reporte');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSearch = () => {
        loadReport();
    };

    if (loading && !summary) {
        return (
            <MainLayout>
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando reportes...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Reportes de Recaudación</h1>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Summary Cards */}
                {summary && (
                    <div className="stats-grid mb-xl">
                        <div className="stat-card success">
                            <p className="stat-label">Hoy</p>
                            <p className="stat-value">{formatCurrency(summary.today.total)}</p>
                            <p className="stat-change text-muted">
                                {summary.today.orders_count} pedidos entregados
                            </p>
                        </div>

                        <div className="stat-card">
                            <p className="stat-label">Esta Semana</p>
                            <p className="stat-value">{formatCurrency(summary.week.total)}</p>
                            <p className="stat-change text-muted">
                                {summary.week.orders_count} pedidos entregados
                            </p>
                        </div>

                        <div className="stat-card">
                            <p className="stat-label">Este Mes</p>
                            <p className="stat-value">{formatCurrency(summary.month.total)}</p>
                            <p className="stat-change text-muted">
                                {summary.month.orders_count} pedidos entregados
                            </p>
                        </div>

                        <div className="stat-card warning">
                            <p className="stat-label">Pendientes</p>
                            <p className="stat-value">{summary.pending_orders}</p>
                            <p className="stat-change text-muted">
                                Pedidos por entregar
                            </p>
                        </div>
                    </div>
                )}

                {/* Report Type Selector */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Reporte Detallado</h2>
                    </div>

                    <div className={styles.filters}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${reportType === 'daily' ? styles.active : ''}`}
                                onClick={() => setReportType('daily')}
                            >
                                Hoy
                            </button>
                            <button
                                className={`${styles.tab} ${reportType === 'weekly' ? styles.active : ''}`}
                                onClick={() => setReportType('weekly')}
                            >
                                Esta Semana
                            </button>
                            <button
                                className={`${styles.tab} ${reportType === 'monthly' ? styles.active : ''}`}
                                onClick={() => setReportType('monthly')}
                            >
                                Este Mes
                            </button>
                            <button
                                className={`${styles.tab} ${reportType === 'custom' ? styles.active : ''}`}
                                onClick={() => setReportType('custom')}
                            >
                                Personalizado
                            </button>
                        </div>

                        {reportType === 'custom' && (
                            <div className={styles.dateRange}>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="form-input"
                                />
                                <span>a</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="form-input"
                                />
                                <button className="btn btn-primary" onClick={handleCustomSearch}>
                                    Buscar
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : report ? (
                        <>
                            {/* Report Summary */}
                            <div className={styles.reportSummary}>
                                <div className={styles.summaryItem}>
                                    <span className="text-muted">Período:</span>
                                    <strong>
                                        {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                    </strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className="text-muted">Pedidos:</span>
                                    <strong>{report.orders_count}</strong>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className="text-muted">Total Recaudado:</span>
                                    <strong className="text-success text-xl">
                                        {formatCurrency(report.total_revenue)}
                                    </strong>
                                </div>
                            </div>

                            {/* Orders Table */}
                            {report.orders && report.orders.length > 0 ? (
                                <div className="table-container mt-lg">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Cliente</th>
                                                <th>Fecha Evento</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.orders.map(order => (
                                                <tr key={order.id}>
                                                    <td>#{order.id}</td>
                                                    <td>{order.customer_name}</td>
                                                    <td>{formatDate(order.event_date)}</td>
                                                    <td>{order.items_count}</td>
                                                    <td className="price">{formatCurrency(order.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="4" className="text-right font-bold">TOTAL:</td>
                                                <td className="price font-bold">{formatCurrency(report.total_revenue)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p className="empty-state-icon">📊</p>
                                    <p>No hay pedidos entregados en este período</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.selectPrompt}>
                            <p>Seleccione un período para ver el reporte detallado</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
