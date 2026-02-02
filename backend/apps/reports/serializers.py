"""
Serializers for report responses.
"""
from rest_framework import serializers


class OrderSummarySerializer(serializers.Serializer):
    """Summary of an order for reports."""
    id = serializers.IntegerField()
    customer_name = serializers.CharField()
    event_date = serializers.DateField()
    items_count = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)


class RevenueReportSerializer(serializers.Serializer):
    """Revenue report response."""
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders_count = serializers.IntegerField()
    orders = OrderSummarySerializer(many=True)


class PeriodSummarySerializer(serializers.Serializer):
    """Summary for a time period."""
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders_count = serializers.IntegerField()


class DashboardSummarySerializer(serializers.Serializer):
    """Dashboard summary response."""
    today = PeriodSummarySerializer()
    week = PeriodSummarySerializer()
    month = PeriodSummarySerializer()
    pending_orders = serializers.IntegerField()
