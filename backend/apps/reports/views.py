"""
API views for revenue reports.
"""
from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services import (
    get_daily_report,
    get_weekly_report,
    get_monthly_report,
    get_revenue_report,
    get_summary_report,
)


class DailReportView(APIView):
    """
    Get revenue report for a specific day.
    
    Query params:
        date: Optional date in YYYY-MM-DD format (defaults to today)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        target_date = request.query_params.get('date')
        report = get_daily_report(target_date)
        return Response(report)


class WeeklyReportView(APIView):
    """
    Get revenue report for a week.
    
    Query params:
        date: Optional date in YYYY-MM-DD format (defaults to current week)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        target_date = request.query_params.get('date')
        report = get_weekly_report(target_date)
        return Response(report)


class MonthlyReportView(APIView):
    """
    Get revenue report for a month.
    
    Query params:
        year: Optional year (defaults to current year)
        month: Optional month 1-12 (defaults to current month)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if year:
            year = int(year)
        if month:
            month = int(month)
        
        report = get_monthly_report(year, month)
        return Response(report)


class CustomReportView(APIView):
    """
    Get revenue report for a custom date range.
    
    Query params:
        start_date: Required start date in YYYY-MM-DD format
        end_date: Required end date in YYYY-MM-DD format
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'Se requieren start_date y end_date'},
                status=400
            )
        
        try:
            start = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=400
            )
        
        if start > end:
            return Response(
                {'error': 'start_date debe ser anterior a end_date'},
                status=400
            )
        
        report = get_revenue_report(start, end)
        return Response(report)


class SummaryReportView(APIView):
    """
    Get dashboard summary with today, week, and month totals.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        summary = get_summary_report()
        return Response(summary)
