"""
URL routing for Reports API.
"""
from django.urls import path
from .views import (
    DailReportView,
    WeeklyReportView,
    MonthlyReportView,
    CustomReportView,
    SummaryReportView,
)

urlpatterns = [
    path('daily/', DailReportView.as_view(), name='report-daily'),
    path('weekly/', WeeklyReportView.as_view(), name='report-weekly'),
    path('monthly/', MonthlyReportView.as_view(), name='report-monthly'),
    path('custom/', CustomReportView.as_view(), name='report-custom'),
    path('summary/', SummaryReportView.as_view(), name='report-summary'),
]
