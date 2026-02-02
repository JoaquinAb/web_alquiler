"""
Admin configuration for Orders.
"""
from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'event_date', 'status', 'total', 'created_at']
    list_filter = ['status', 'event_date']
    search_fields = ['customer_name', 'customer_phone']
    ordering = ['-created_at']
    inlines = [OrderItemInline]
    readonly_fields = ['total', 'created_at', 'updated_at']
