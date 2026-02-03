from django.urls import path

from apps.results.api.views.index import (
    JsonToToonView,
    EvaluationCreateView,
    EvaluationDetailView,
    EvaluationListView,
    RunEvaluationView,
    EvaluationReportView,
    EvaluationReportPDFView,
    EvaluationReportPrintView,  # ✅ nuevo
    InformeDataUsersExportAPIView,
    InformeDataUsersAPIView,
)

urlpatterns = [
    path("results/json-to-toon/", JsonToToonView.as_view(), name="json-to-toon"),

    path("results/", EvaluationListView.as_view(), name="evaluation-list"),
    path("results/create/", EvaluationCreateView.as_view(), name="evaluation-create"),
    path("results/<uuid:uuid>/", EvaluationDetailView.as_view(), name="evaluation-detail"),
    path("results/<uuid:uuid>/run/", RunEvaluationView.as_view(), name="evaluation-run"),

    path("results/<uuid:uuid>/report/", EvaluationReportView.as_view(), name="report-json"),

    # ✅ HTML print
    path("results/<uuid:uuid>/report/print/", EvaluationReportPrintView.as_view(), name="report-print"),

    # ✅ PDF (ahora imprime el HTML print)
    path("results/<uuid:uuid>/report/pdf/", EvaluationReportPDFView.as_view(), name="report-pdf"),

    path("results/report/users/", InformeDataUsersAPIView.as_view(), name="results-report-users"),
    path("results/report/users/export/", InformeDataUsersExportAPIView.as_view(), name="results-report-users-export"),
]
