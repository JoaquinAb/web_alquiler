"""
Revenue reporting services.

IMPORTANT: All calculations are done dynamically from the database.
No caching is used to ensure reports are always accurate.
"""
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, F, Count
from apps.orders.models import Order


def get_revenue_report(start_date, end_date):
    """
    Calculate revenue for a date range.
    Only includes orders with status='entregado'.
    
    Args:
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
    
    Returns:
        dict with total revenue, order count, and order list
    """
    # Query orders in date range with 'entregado' status
    orders = Order.objects.filter(
        status='entregado',
        event_date__gte=start_date,
        event_date__lte=end_date
    ).prefetch_related('items__product').order_by('-event_date')
    
    # Calculate totals dynamically
    total_revenue = Decimal('0.00')
    orders_data = []
    
    for order in orders:
        order_total = order.total  # Calculated property
        total_revenue += order_total
        orders_data.append({
            'id': order.id,
            'customer_name': order.customer_name,
            'event_date': order.event_date.isoformat(),
            'items_count': order.items_count,
            'total': float(order_total),
        })
    
    return {
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'total_revenue': float(total_revenue),
        'orders_count': len(orders_data),
        'orders': orders_data,
    }


def get_daily_report(target_date=None):
    """Get revenue report for a specific day."""
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)
    
    return get_revenue_report(target_date, target_date)


def get_weekly_report(target_date=None):
    """Get revenue report for the week containing target_date."""
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)
    
    # Get start of week (Monday)
    start_of_week = target_date - timedelta(days=target_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    report = get_revenue_report(start_of_week, end_of_week)
    report['week_number'] = target_date.isocalendar()[1]
    return report


def get_monthly_report(year=None, month=None):
    """Get revenue report for a specific month."""
    if year is None:
        year = date.today().year
    if month is None:
        month = date.today().month
    
    # Get start and end of month
    start_of_month = date(year, month, 1)
    if month == 12:
        end_of_month = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_of_month = date(year, month + 1, 1) - timedelta(days=1)
    
    report = get_revenue_report(start_of_month, end_of_month)
    report['year'] = year
    report['month'] = month
    return report


def get_summary_report():
    """
    Get a summary with today, this week, and this month totals.
    Useful for dashboard display.
    """
    today = date.today()
    
    # Today's revenue
    today_orders = Order.objects.filter(
        status='entregado',
        event_date=today
    )
    today_total = sum(order.total for order in today_orders)
    
    # This week's revenue
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    week_orders = Order.objects.filter(
        status='entregado',
        event_date__gte=start_of_week,
        event_date__lte=end_of_week
    )
    week_total = sum(order.total for order in week_orders)
    
    # This month's revenue
    start_of_month = date(today.year, today.month, 1)
    if today.month == 12:
        end_of_month = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        end_of_month = date(today.year, today.month + 1, 1) - timedelta(days=1)
    month_orders = Order.objects.filter(
        status='entregado',
        event_date__gte=start_of_month,
        event_date__lte=end_of_month
    )
    month_total = sum(order.total for order in month_orders)
    
    # Pending orders count
    pending_count = Order.objects.filter(status='pendiente').count()
    
    return {
        'today': {
            'date': today.isoformat(),
            'total': float(today_total),
            'orders_count': today_orders.count(),
        },
        'week': {
            'start_date': start_of_week.isoformat(),
            'end_date': end_of_week.isoformat(),
            'total': float(week_total),
            'orders_count': week_orders.count(),
        },
        'month': {
            'year': today.year,
            'month': today.month,
            'total': float(month_total),
            'orders_count': month_orders.count(),
        },
        'pending_orders': pending_count,
    }
