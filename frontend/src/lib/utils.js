/**
 * Utility functions for the application.
 */

/**
 * Format currency amount
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days from now
 */
export function getDateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status) {
    const classes = {
        pendiente: 'badge-warning',
        entregado: 'badge-success',
        cancelado: 'badge-danger',
    };
    return classes[status] || 'badge-info';
}

/**
 * Get status display text
 */
export function getStatusText(status) {
    const texts = {
        pendiente: 'Pendiente',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
    };
    return texts[status] || status;
}

/**
 * Product categories
 */
export const PRODUCT_CATEGORIES = [
    { value: 'vajilla', label: 'Vajilla' },
    { value: 'sillas', label: 'Sillas' },
    { value: 'mesas', label: 'Mesas' },
    { value: 'manteles', label: 'Manteles' },
    { value: 'cubiertos', label: 'Cubiertos' },
    { value: 'cristaleria', label: 'Cristalería' },
    { value: 'decoracion', label: 'Decoración' },
    { value: 'otros', label: 'Otros' },
];

/**
 * Order statuses
 */
export const ORDER_STATUSES = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' },
];
