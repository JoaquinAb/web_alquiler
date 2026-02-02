"""
Product models for managing rental inventory.
"""
from django.db import models


class Product(models.Model):
    """
    Represents a product available for rent (dishes, chairs, tables, etc.)
    """
    CATEGORY_CHOICES = [
        ('vajilla', 'Vajilla'),
        ('sillas', 'Sillas'),
        ('mesas', 'Mesas'),
        ('manteles', 'Manteles'),
        ('cubiertos', 'Cubiertos'),
        ('cristaleria', 'Cristalería'),
        ('decoracion', 'Decoración'),
        ('otros', 'Otros'),
    ]
    
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre'
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='otros',
        verbose_name='Categoría'
    )
    price_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por unidad'
    )
    stock = models.PositiveIntegerField(
        default=0,
        verbose_name='Stock disponible'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
