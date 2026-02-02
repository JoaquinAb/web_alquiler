"""
Serializers for Product model.
"""
from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product CRUD operations."""
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'category_display',
            'price_per_unit',
            'stock',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_price_per_unit(self, value):
        """Ensure price is positive."""
        if value <= 0:
            raise serializers.ValidationError(
                'El precio debe ser mayor a 0.'
            )
        return value
    
    def validate_stock(self, value):
        """Ensure stock is non-negative."""
        if value < 0:
            raise serializers.ValidationError(
                'El stock no puede ser negativo.'
            )
        return value


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products."""
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'category_display',
            'price_per_unit',
            'stock',
            'is_active',
        ]
