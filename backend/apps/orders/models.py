"""
Order models for managing rental orders.
"""
from django.db import models
from django.db.models import Sum, F
from decimal import Decimal

from apps.products.models import Product


class Order(models.Model):
    """
    Represents a rental order from a customer.
    """
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    customer_name = models.CharField(
        max_length=200,
        verbose_name='Nombre del cliente'
    )
    customer_phone = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Teléfono del cliente'
    )
    customer_address = models.TextField(
        blank=True,
        verbose_name='Dirección del cliente'
    )
    event_date = models.DateField(
        verbose_name='Fecha del evento'
    )
    delivery_date = models.DateField(
        verbose_name='Fecha de entrega'
    )
    return_date = models.DateField(
        verbose_name='Fecha de devolución'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )
    observations = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido #{self.id} - {self.customer_name}"
    
    @property
    def total(self):
        """
        Calculate total dynamically from order items.
        This ensures reports are always accurate.
        """
        result = self.items.aggregate(
            total=Sum(F('quantity') * F('unit_price'))
        )['total']
        return result or Decimal('0.00')
    
    @property
    def items_count(self):
        """Total number of items in the order."""
        return self.items.aggregate(total=Sum('quantity'))['total'] or 0


class OrderItem(models.Model):
    """
    Represents a line item in an order.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Pedido'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name='Producto'
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio unitario'
    )
    
    class Meta:
        verbose_name = 'Item del pedido'
        verbose_name_plural = 'Items del pedido'
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    @property
    def subtotal(self):
        """Calculate line item subtotal."""
        if self.unit_price is None:
            return Decimal('0.00')
        return self.quantity * self.unit_price
    
    def save(self, *args, **kwargs):
        """Set unit price from product if not provided."""
        if self.unit_price is None and self.product_id:
            self.unit_price = self.product.price_per_unit
        super().save(*args, **kwargs)
