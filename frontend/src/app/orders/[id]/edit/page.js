'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { ordersAPI, productsAPI } from '@/lib/api';
import { formatCurrency, getStatusText, ORDER_STATUSES } from '@/lib/utils';
import styles from '../../new/page.module.css';

export default function EditOrderPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        event_date: '',
        delivery_date: '',
        return_date: '',
        status: 'pendiente',
        observations: '',
    });

    // Order items
    const [orderItems, setOrderItems] = useState([]);

    // Product selection
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        loadData();
    }, [orderId]);

    const loadData = async () => {
        try {
            const [orderData, productsData] = await Promise.all([
                ordersAPI.get(orderId),
                productsAPI.list({ is_active: 'true' }),
            ]);

            // Set form data
            setFormData({
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone || '',
                customer_address: orderData.customer_address || '',
                event_date: orderData.event_date,
                delivery_date: orderData.delivery_date,
                return_date: orderData.return_date,
                status: orderData.status,
                observations: orderData.observations || '',
            });

            // Set order items
            setOrderItems(orderData.items.map(item => ({
                product: item.product,
                product_name: item.product_name,
                product_category: item.product_category,
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price),
            })));

            setProducts(productsData.results || productsData);
        } catch (err) {
            setError('Error al cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addItem = () => {
        if (!selectedProduct || quantity < 1) return;

        const product = products.find(p => p.id === parseInt(selectedProduct));
        if (!product) return;

        const existingIndex = orderItems.findIndex(item => item.product === product.id);

        if (existingIndex >= 0) {
            const updated = [...orderItems];
            updated[existingIndex].quantity += quantity;
            setOrderItems(updated);
        } else {
            setOrderItems([...orderItems, {
                product: product.id,
                product_name: product.name,
                product_category: product.category_display,
                quantity: quantity,
                unit_price: parseFloat(product.price_per_unit),
            }]);
        }

        setSelectedProduct('');
        setQuantity(1);
    };

    const removeItem = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return;
        const updated = [...orderItems];
        updated[index].quantity = newQuantity;
        setOrderItems(updated);
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (orderItems.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const orderData = {
                ...formData,
                items: orderItems.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
            };

            await ordersAPI.update(orderId, orderData);
            router.push('/orders');
        } catch (err) {
            setError(err.message || 'Error al actualizar pedido');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            await ordersAPI.downloadPDF(orderId);
        } catch (err) {
            setError('Error al descargar PDF');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando pedido...</p>
                </div>
            </MainLayout>
        );
    }

    const isCancelled = formData.status === 'cancelado';

    return (
        <MainLayout>
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">
                        Editar Pedido #{orderId}
                        <span className={`badge ${formData.status === 'entregado' ? 'badge-success' : formData.status === 'cancelado' ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: '1rem' }}>
                            {getStatusText(formData.status)}
                        </span>
                    </h1>
                    <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                        📄 Descargar PDF
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {isCancelled && <div className="alert alert-warning">Este pedido está cancelado y no se puede modificar.</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-2">
                        {/* Customer Info */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Datos del Cliente</h2>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nombre del Cliente *</label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={formData.customer_name}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    disabled={isCancelled}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="tel"
                                    name="customer_phone"
                                    value={formData.customer_phone}
                                    onChange={handleChange}
                                    className="form-input"
                                    disabled={isCancelled}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Dirección</label>
                                <textarea
                                    name="customer_address"
                                    value={formData.customer_address}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows="2"
                                    disabled={isCancelled}
                                />
                            </div>
                        </div>

                        {/* Event Dates & Status */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Fechas y Estado</h2>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Estado *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="form-select"
                                    disabled={isCancelled}
                                >
                                    {ORDER_STATUSES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fecha del Evento *</label>
                                <input
                                    type="date"
                                    name="event_date"
                                    value={formData.event_date}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    disabled={isCancelled}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fecha de Entrega *</label>
                                <input
                                    type="date"
                                    name="delivery_date"
                                    value={formData.delivery_date}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    disabled={isCancelled}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fecha de Devolución *</label>
                                <input
                                    type="date"
                                    name="return_date"
                                    value={formData.return_date}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    disabled={isCancelled}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="card mt-lg">
                        <div className="card-header">
                            <h2 className="card-title">Productos</h2>
                        </div>

                        {!isCancelled && (
                            <div className={styles.addProduct}>
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">Agregar producto...</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - {formatCurrency(product.price_per_unit)}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    min="1"
                                    className="form-input"
                                    style={{ width: '100px' }}
                                />

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={addItem}
                                    disabled={!selectedProduct}
                                >
                                    ➕ Agregar
                                </button>
                            </div>
                        )}

                        {orderItems.length === 0 ? (
                            <div className={styles.emptyItems}>
                                <p>No hay productos</p>
                            </div>
                        ) : (
                            <div className="table-container mt-md">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Subtotal</th>
                                            {!isCancelled && <th></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.product_name}</td>
                                                <td>{item.product_category}</td>
                                                <td>
                                                    {isCancelled ? (
                                                        item.quantity
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                                                            min="1"
                                                            className="form-input"
                                                            style={{ width: '80px' }}
                                                        />
                                                    )}
                                                </td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td className="price">{formatCurrency(item.quantity * item.unit_price)}</td>
                                                {!isCancelled && (
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={isCancelled ? 4 : 4} className="text-right font-bold">TOTAL:</td>
                                            <td className="price font-bold text-xl">{formatCurrency(calculateTotal())}</td>
                                            {!isCancelled && <td></td>}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Observations */}
                    <div className="card mt-lg">
                        <div className="card-header">
                            <h2 className="card-title">Observaciones</h2>
                        </div>
                        <textarea
                            name="observations"
                            value={formData.observations}
                            onChange={handleChange}
                            className="form-textarea"
                            rows="3"
                            disabled={isCancelled}
                        />
                    </div>

                    {/* Actions */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg"
                            onClick={() => router.push('/orders')}
                        >
                            Volver
                        </button>
                        {!isCancelled && (
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={saving || orderItems.length === 0}
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
