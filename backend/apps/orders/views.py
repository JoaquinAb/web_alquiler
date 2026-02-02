"""
API views for Order management.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db import transaction

from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrderUpdateSerializer,
    OrderListSerializer,
    OrderStatusSerializer,
)
from .services import generate_order_pdf


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing orders.
    
    Provides CRUD operations plus status changes and PDF generation.
    """
    queryset = Order.objects.prefetch_related('items__product')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'event_date', 'delivery_date', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return OrderListSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        elif self.action == 'change_status':
            return OrderStatusSerializer
        return OrderSerializer
    
    def get_queryset(self):
        """Filter orders by status if provided."""
        queryset = Order.objects.prefetch_related('items__product')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(event_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(event_date__lte=end_date)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new order with items."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Return full order with items
        output_serializer = OrderSerializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update order with items."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        output_serializer = OrderSerializer(order)
        return Response(output_serializer.data)
    
    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        """Change order status."""
        order = self.get_object()
        serializer = self.get_serializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        output_serializer = OrderSerializer(order)
        return Response(output_serializer.data)
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate and return order PDF."""
        order = self.get_object()
        
        # Generate PDF
        pdf_buffer = generate_order_pdf(order)
        
        # Create response
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="pedido_{order.id}.pdf"'
        
        return response
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending orders."""
        orders = Order.objects.filter(status='pendiente').prefetch_related('items__product')
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def delivered(self, request):
        """Get all delivered orders."""
        orders = Order.objects.filter(status='entregado').prefetch_related('items__product')
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """
        Cancel order instead of deleting.
        Sets status to 'cancelado'.
        """
        order = self.get_object()
        
        # Instead of deleting, mark as cancelled
        if order.status == 'cancelado':
            return Response(
                {'error': 'El pedido ya está cancelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelado'
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
