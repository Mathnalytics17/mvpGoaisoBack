# views
from django.urls import path
from apps.results.api.views.index import JsonToToonView
from apps.results.api.views.index import (
    EvaluationCreateView,
    EvaluationDetailView,
    EvaluationListView,
    RunEvaluationView,
    EvaluationReportView,
    InformeDataUsersExportAPIView,
    InformeDataUsersAPIView,
    EvaluationReportPDFView
)

urlpatterns = [
    path("results/json-to-toon/", JsonToToonView.as_view(), name="json-to-toon"),
    
    path("results/", EvaluationListView.as_view(), name="evaluation-list"),
    path("results/create/", EvaluationCreateView.as_view(), name="evaluation-create"),
    path("results/<uuid:uuid>/", EvaluationDetailView.as_view(), name="evaluation-detail"),
    path("results/<uuid:uuid>/run/", RunEvaluationView.as_view(), name="evaluation-run"),
    path("results/<uuid:uuid>/report/", EvaluationReportView.as_view()),
     path("results/report/users/", InformeDataUsersAPIView.as_view(), name="results-report-users"),
       path("results/<uuid:uuid>/report/pdf/", EvaluationReportPDFView.as_view(), name="report-pdf"),
    path("results/report/users/export/", InformeDataUsersExportAPIView.as_view(), name="results-report-users-export"),
]