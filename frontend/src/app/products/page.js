'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { productsAPI } from '@/lib/api';
import { formatCurrency, PRODUCT_CATEGORIES } from '@/lib/utils';
import styles from './page.module.css';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'otros',
        price_per_unit: '',
        stock: '',
        description: '',
        is_active: true,
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Filter state
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        loadProducts();
    }, [categoryFilter]);

    const loadProducts = async () => {
        try {
            const params = {};
            if (categoryFilter) params.category = categoryFilter;
            const data = await productsAPI.list(params);
            setProducts(data.results || data);
        } catch (err) {
            setError('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category: 'otros',
            price_per_unit: '',
            stock: '',
            description: '',
            is_active: true,
        });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price_per_unit: product.price_per_unit,
            stock: product.stock,
            description: product.description || '',
            is_active: product.is_active,
        });
        setFormError('');
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const data = {
                ...formData,
                price_per_unit: parseFloat(formData.price_per_unit),
                stock: parseInt(formData.stock, 10),
            };

            if (editingProduct) {
                await productsAPI.update(editingProduct.id, data);
                setSuccess('Producto actualizado correctamente');
            } else {
                await productsAPI.create(data);
                setSuccess('Producto creado correctamente');
            }

            setShowModal(false);
            loadProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setFormError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await productsAPI.delete(id);
            setDeleteConfirm(null);
            setSuccess('Producto eliminado');
            loadProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Error al eliminar');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando productos...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Productos</h1>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        ➕ Nuevo Producto
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Filters */}
                <div className={styles.filters}>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Todas las categorías</option>
                        {PRODUCT_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                {/* Products Table */}
                {products.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <p className="empty-state-icon">📦</p>
                            <p>No hay productos</p>
                            <button className="btn btn-primary mt-md" onClick={openCreateModal}>
                                Crear primer producto
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td>
                                            <strong>{product.name}</strong>
                                        </td>
                                        <td>{product.category_display}</td>
                                        <td className="price">{formatCurrency(product.price_per_unit)}</td>
                                        <td>{product.stock}</td>
                                        <td>
                                            <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                {product.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => openEditModal(product)}
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => setDeleteConfirm(product)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Product Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {formError && <div className="alert alert-error">{formError}</div>}

                                    <div className="form-group">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Categoría *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="form-select"
                                            required
                                        >
                                            {PRODUCT_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Precio por Unidad *</label>
                                            <input
                                                type="number"
                                                name="price_per_unit"
                                                value={formData.price_per_unit}
                                                onChange={handleChange}
                                                className="form-input"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Stock *</label>
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleChange}
                                                className="form-input"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Descripción</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="form-textarea"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleChange}
                                            />
                                            <span>Producto activo</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Confirmar Eliminación</h3>
                                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>¿Está seguro de eliminar el producto <strong>{deleteConfirm.name}</strong>?</p>
                                <p className="text-muted mt-sm">Esta acción no se puede deshacer.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setDeleteConfirm(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
