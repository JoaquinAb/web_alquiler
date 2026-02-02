'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { ordersAPI, productsAPI } from '@/lib/api';
import { formatCurrency, getCurrentDate, getDateOffset, PRODUCT_CATEGORIES } from '@/lib/utils';
import styles from './page.module.css';

export default function NewOrderPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        event_date: getCurrentDate(),
        delivery_date: getCurrentDate(),
        return_date: getDateOffset(1),
        observations: '',
    });

    // Order items
    const [orderItems, setOrderItems] = useState([]);

    // Product selection
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productsAPI.list({ is_active: 'true' });
            setProducts(data.results || data);
        } catch (err) {
            setError('Error al cargar productos');
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

        // Check if already in list
        const existingIndex = orderItems.findIndex(item => item.product === product.id);

        if (existingIndex >= 0) {
            // Update quantity
            const updated = [...orderItems];
            updated[existingIndex].quantity += quantity;
            setOrderItems(updated);
        } else {
            // Add new item
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

            const result = await ordersAPI.create(orderData);

            // Ask if want to download PDF
            if (confirm('Pedido creado exitosamente. ¿Desea descargar el PDF?')) {
                await ordersAPI.downloadPDF(result.id);
            }

            router.push('/orders');
        } catch (err) {
            setError(err.message || 'Error al crear pedido');
        } finally {
            setSaving(false);
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
                    <h1 className="page-title">Nuevo Pedido</h1>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

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
                                    placeholder="Nombre completo"
                                    required
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
                                    placeholder="Número de contacto"
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
                                    placeholder="Dirección de entrega"
                                />
                            </div>
                        </div>

                        {/* Event Dates */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Fechas del Evento</h2>
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
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products Selection */}
                    <div className="card mt-lg">
                        <div className="card-header">
                            <h2 className="card-title">Productos a Alquilar</h2>
                        </div>

                        {/* Add Product */}
                        <div className={styles.addProduct}>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Seleccionar producto...</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} - {formatCurrency(product.price_per_unit)} (Stock: {product.stock})
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
                                placeholder="Cant."
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

                        {/* Items List */}
                        {orderItems.length === 0 ? (
                            <div className={styles.emptyItems}>
                                <p>No hay productos agregados</p>
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
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.product_name}</td>
                                                <td>{item.product_category}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                                                        min="1"
                                                        className="form-input"
                                                        style={{ width: '80px' }}
                                                    />
                                                </td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td className="price">{formatCurrency(item.quantity * item.unit_price)}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeItem(index)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" className="text-right font-bold">TOTAL:</td>
                                            <td className="price font-bold text-xl">{formatCurrency(calculateTotal())}</td>
                                            <td></td>
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
                            placeholder="Notas adicionales sobre el pedido..."
                        />
                    </div>

                    {/* Actions */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg"
                            onClick={() => router.push('/orders')}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={saving || orderItems.length === 0}
                        >
                            {saving ? 'Guardando...' : 'Crear Pedido'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
