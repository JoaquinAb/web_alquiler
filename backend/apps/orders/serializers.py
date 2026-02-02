"""
Serializers for Order and OrderItem models.
"""
from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem with product details."""
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )
    product_category = serializers.CharField(
        source='product.get_category_display',
        read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_category',
            'quantity',
            'unit_price',
            'subtotal',
        ]
    
    def validate_quantity(self, value):
        """Ensure quantity is positive."""
        if value <= 0:
            raise serializers.ValidationError(
                'La cantidad debe ser mayor a 0.'
            )
        return value


class OrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating order items."""
    
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                'La cantidad debe ser mayor a 0.'
            )
        return value


class OrderSerializer(serializers.ModelSerializer):
    """Full serializer for Order with items."""
    items = OrderItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    items_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = Order
        fields = [
            'id',
            'customer_name',
            'customer_phone',
            'customer_address',
            'event_date',
            'delivery_date',
            'return_date',
            'status',
            'status_display',
            'observations',
            'items',
            'items_count',
            'total',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with items."""
    items = OrderItemCreateSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'customer_name',
            'customer_phone',
            'customer_address',
            'event_date',
            'delivery_date',
            'return_date',
            'observations',
            'items',
        ]
    
    def validate_items(self, value):
        """Ensure at least one item is provided."""
        if not value:
            raise serializers.ValidationError(
                'El pedido debe tener al menos un producto.'
            )
        return value
    
    def validate(self, data):
        """Validate dates are in correct order."""
        delivery_date = data.get('delivery_date')
        event_date = data.get('event_date')
        return_date = data.get('return_date')
        
        if delivery_date and event_date and delivery_date > event_date:
            raise serializers.ValidationError({
                'delivery_date': 'La fecha de entrega no puede ser posterior al evento.'
            })
        
        if event_date and return_date and return_date < event_date:
            raise serializers.ValidationError({
                'return_date': 'La fecha de devolución no puede ser anterior al evento.'
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create order with items in a transaction."""
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            # Get product to set default price if not provided
            product = item_data['product']
            if 'unit_price' not in item_data or not item_data['unit_price']:
                item_data['unit_price'] = product.price_per_unit
            
            OrderItem.objects.create(order=order, **item_data)
        
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating orders with items."""
    items = OrderItemCreateSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'customer_name',
            'customer_phone',
            'customer_address',
            'event_date',
            'delivery_date',
            'return_date',
            'observations',
            'status',
            'items',
        ]
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                'El pedido debe tener al menos un producto.'
            )
        return value
    
    def validate_status(self, value):
        """Validate status transitions."""
        instance = self.instance
        if instance and instance.status == 'cancelado' and value != 'cancelado':
            raise serializers.ValidationError(
                'No se puede cambiar el estado de un pedido cancelado.'
            )
        return value
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update order and replace items."""
        items_data = validated_data.pop('items', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Replace items if provided
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                product = item_data['product']
                if 'unit_price' not in item_data or not item_data['unit_price']:
                    item_data['unit_price'] = product.price_per_unit
                OrderItem.objects.create(order=instance, **item_data)
        
        return instance


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing orders."""
    total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    items_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = Order
        fields = [
            'id',
            'customer_name',
            'event_date',
            'delivery_date',
            'status',
            'status_display',
            'items_count',
            'total',
            'created_at',
        ]


class OrderStatusSerializer(serializers.ModelSerializer):
    """Serializer for updating order status only."""
    
    class Meta:
        model = Order
        fields = ['status']
    
    def validate_status(self, value):
        instance = self.instance
        if instance and instance.status == 'cancelado':
            raise serializers.ValidationError(
                'No se puede cambiar el estado de un pedido cancelado.'
            )
        return value
