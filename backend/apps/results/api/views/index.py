import json
import os
import random
import tempfile
import subprocess
from itertools import permutations

from django.conf import settings
from django.db import transaction
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.timezone import now

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from openpyxl.utils import get_column_letter

from apps.results.api.models.index import (
    Evaluation,
    EvaluationCriterion,
    PromptRun,
    RankingItem,
    RankingSummary,
    InformeDataUsers,
)

from apps.results.api.serializers.index import (
    EvaluationSerializer,
    EvaluationCreateSerializer,
    InformeDataUsersCreateSerializer,
    InformeDataUsersListSerializer,
)

from apps.results.services.prompts import (
    prompt_phase1,
    prompt_phase2,
)

from apps.results.services.parse_ranking import parse_ranking
from apps.results.services.report import build_report
from apps.results.services.scoring import compute_brand_summary
from apps.results.utils.open_ai_client import completion_with_web_search
from apps.results.services.email_report import send_report_pdf_email

# ✅ helper para seleccionar 5 permutaciones sin repetir el mismo inicio
def select_permutations_unique_start(permutations_list, count=5):
    selected = []
    used_first = set()

    random.shuffle(permutations_list)

    for perm in permutations_list:
        if perm[0] not in used_first:
            selected.append(perm)
            used_first.add(perm[0])
        if len(selected) == count:
            break

    for perm in permutations_list:
        if perm not in selected:
            selected.append(perm)
        if len(selected) == count:
            break

    return selected


class EvaluationCreateView(APIView):
    def post(self, request):
        serializer = EvaluationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        country = serializer.validated_data.get("country", "").strip() or None
        location = serializer.validated_data.get("location", "").strip() or None

        evaluation = Evaluation.objects.create(
            product_type=serializer.validated_data["product_type"],
            status="PENDING",
            country=country,
            location=location,
        )

        for idx, c in enumerate(serializer.validated_data["criteria"], start=1):
            EvaluationCriterion.objects.create(
                evaluation=evaluation,
                name=c,
                order=idx,
            )

        return Response(
            {"uuid": str(evaluation.uuid), "status": evaluation.status},
            status=status.HTTP_201_CREATED,
        )


class EvaluationDetailView(APIView):
    """
    GET /api/results/<uuid>/
    """

    def get(self, request, uuid):
        evaluation = get_object_or_404(Evaluation, uuid=uuid)
        serializer = EvaluationSerializer(evaluation)
        return Response(serializer.data)


class EvaluationListView(APIView):
    """
    GET /api/results/
    Lista todas las evaluaciones
    """

    def get(self, request):
        evaluations = Evaluation.objects.all().order_by("-created_at")
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)


class JsonToToonView(APIView):
    """
    (LEGACY) End-point dejado por compatibilidad.
    """

    def post(self, request):
        return Response(
            {"error": "TOON deshabilitado. Usa JSON."},
            status=status.HTTP_410_GONE,
        )


class RunEvaluationView(APIView):
    def post(self, request, uuid):

        # ==========================
        # ✅ LOCK POR UUID
        # ==========================
        with transaction.atomic():
            evaluation = Evaluation.objects.select_for_update().get(uuid=uuid)

            if evaluation.status == "PROCESSING":
                return Response(
                    {"error": "Esta evaluación ya se está ejecutando"},
                    status=status.HTTP_409_CONFLICT,
                )

            evaluation.status = "PROCESSING"
            evaluation.completed_at = None
            evaluation.save()

            PromptRun.objects.filter(evaluation=evaluation).delete()
            RankingItem.objects.filter(prompt_run__evaluation=evaluation).delete()
            RankingSummary.objects.filter(evaluation=evaluation).delete()

        # ==========================
        # ✅ Proceso real
        # ==========================
        try:
            criteria_qs = evaluation.criteria.all().order_by("order")
            criteria = [c.name for c in criteria_qs]

            if len(criteria) < 2:
                evaluation.status = "ERROR"
                evaluation.save()
                return Response(
                    {"error": "Se requieren mínimo 2 criterios"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # =========================
            # ✅ PHASE 1 (5 permutaciones)
            # =========================
            all_perms = list(permutations(criteria, len(criteria)))
            selected_perms = select_permutations_unique_start(all_perms, 5)

            for perm in selected_perms:
                criteria_str = ", ".join(perm)

                prompt = prompt_phase1(
                    evaluation.product_type,
                    criteria_str,
                    country=evaluation.country,
                    location=evaluation.location,
                )

                output_text, sources = completion_with_web_search(prompt)

                try:
                    decoded = json.loads(output_text) if output_text else {}
                except Exception:
                    decoded = {}

                parsed = parse_ranking(decoded) or []

                run = PromptRun.objects.create(
                    evaluation=evaluation,
                    phase="PHASE1",
                    prompt_text=prompt,
                    response_raw=output_text,
                    sources=sources,
                )

                for item in parsed[:5]:
                    RankingItem.objects.create(
                        prompt_run=run,
                        position=item["position"],
                        brand=item["brand"],
                        model=item["model"],
                        raw_text=item["raw_text"],
                    )

            compute_brand_summary(evaluation, phase="PHASE1")

            # =========================
            # ✅ PHASE 2 (5 prompts por criterio)
            # =========================
            for criterion_obj in criteria_qs:
                for _ in range(5):
                    prompt = prompt_phase2(
                        evaluation.product_type,
                        criterion_obj.name,
                        country=evaluation.country,
                        location=evaluation.location,
                    )

                    output_text, sources = completion_with_web_search(prompt)

                    try:
                        decoded = json.loads(output_text) if output_text else {}
                    except Exception:
                        decoded = {}

                    parsed = parse_ranking(decoded) or []

                    run = PromptRun.objects.create(
                        evaluation=evaluation,
                        phase="PHASE2",
                        criterion=criterion_obj,
                        prompt_text=prompt,
                        response_raw=output_text,
                        sources=sources,
                    )

                    for item in parsed[:5]:
                        RankingItem.objects.create(
                            prompt_run=run,
                            position=item["position"],
                            brand=item["brand"],
                            model=item["model"],
                            raw_text=item["raw_text"],
                        )

                compute_brand_summary(evaluation, phase="PHASE2", criterion=criterion_obj)

            evaluation.status = "SUCCESS"
            evaluation.completed_at = timezone.now()
            evaluation.save()

            return Response(
                {"status": evaluation.status, "uuid": str(evaluation.uuid)},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            evaluation.status = "ERROR"
            evaluation.save()
            return Response(
                {"error": "Error inesperado ejecutando evaluación", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EvaluationReportView(APIView):
    def get(self, request, uuid):
        evaluation = get_object_or_404(Evaluation, uuid=uuid)
        return Response(build_report(evaluation), status=status.HTTP_200_OK)


# ✅ NUEVO: HTML liviano para imprimir
class EvaluationReportPrintView(APIView):
    """
    GET /api/results/<uuid>/report/print/
    Renderiza HTML server-side (sin Next/Recharts) para que Puppeteer lo convierta a PDF sin OOM.
    """
    permission_classes = [AllowAny]

    def get(self, request, uuid):
        evaluation = get_object_or_404(Evaluation, uuid=uuid)
        report = build_report(evaluation)

        # timestamp human friendly
        ts = report.get("timestamp")
        try:
            dt = parse_datetime(ts) if isinstance(ts, str) else None
            report["timestamp_human"] = dt.strftime("%Y-%m-%d %H:%M") if dt else str(ts)
        except Exception:
            report["timestamp_human"] = str(ts)

        # recortes para mantener igual al front
        try:
            if "phase1" in report and "topModels" in report["phase1"]:
                report["phase1"]["topModels"] = report["phase1"]["topModels"][:10]
            for c in report.get("phase2", []):
                c["topBrands"] = (c.get("topBrands") or [])[:12]
        except Exception:
            pass

        # tu template está en apps/base/templates/report_print.html
        return render(request, "report_print.html", {"report": report})


def apply_filters(request, qs):
    search = (request.GET.get("search") or "").strip()
    nombre = (request.GET.get("nombre") or "").strip()
    email = (request.GET.get("email") or "").strip()
    movil = (request.GET.get("movil") or "").strip()
    uuid = (request.GET.get("uuid") or "").strip()

    if uuid:
        qs = qs.filter(evaluation__uuid=uuid)

    if nombre:
        qs = qs.filter(nombre__icontains=nombre)
    if email:
        qs = qs.filter(email__icontains=email)
    if movil:
        qs = qs.filter(movil__icontains=movil)

    if search:
        qs = qs.filter(nombre__icontains=search) | qs.filter(email__icontains=search) | qs.filter(
            movil__icontains=search
        ) | qs.filter(evaluation__uuid__icontains=search)

    ordering = (request.GET.get("ordering") or "-id").strip()
    allowed = {"id", "-id", "nombre", "-nombre", "email", "-email"}
    if ordering not in allowed:
        ordering = "-id"
    return qs.order_by(ordering)


class InformeDataUsersAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = InformeDataUsers.objects.select_related("evaluation").all()
        qs = apply_filters(request, qs)

        try:
            page = int(request.GET.get("page", "1"))
        except ValueError:
            page = 1
        try:
            page_size = int(request.GET.get("page_size", "20"))
        except ValueError:
            page_size = 20

        page = max(1, page)
        page_size = min(max(1, page_size), 200)

        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        rows = qs[start:end]

        serializer = InformeDataUsersListSerializer(rows, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = InformeDataUsersCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()

        return Response(
            {"ok": True, "id": lead.id, "evaluation_uuid": str(lead.evaluation.uuid)},
            status=status.HTTP_201_CREATED,
        )


class InformeDataUsersExportAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = InformeDataUsers.objects.select_related("evaluation").all()
        qs = apply_filters(request, qs)

        wb = Workbook()
        ws = wb.active
        ws.title = "Leads Informe"

        headers = ["ID", "Evaluation UUID", "Nombre", "Email", "Móvil"]
        ws.append(headers)

        header_font = Font(bold=True)
        for col_idx in range(1, len(headers) + 1):
            c = ws.cell(row=1, column=col_idx)
            c.font = header_font
            c.alignment = Alignment(vertical="center")

        for row in qs.iterator():
            ws.append(
                [
                    row.id,
                    str(row.evaluation.uuid) if row.evaluation_id else "",
                    row.nombre,
                    row.email,
                    row.movil or "",
                ]
            )

        ws.auto_filter.ref = ws.dimensions
        ws.freeze_panes = "A2"

        widths = [8, 40, 28, 34, 18]
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w

        filename = f"leads_informe_{now().strftime('%Y%m%d_%H%M')}.xlsx"
        resp = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        wb.save(resp)
        return resp


class EvaluationReportPDFView(APIView):
    """
    GET /api/results/<uuid>/report/pdf/
    ✅ Ahora genera PDF desde el HTML print server-side (liviano).
    """
    permission_classes = [AllowAny]

    def get(self, request, uuid):
        # ✅ IMPORTANTÍSIMO: en prod dentro del contenedor backend, usa localhost
        # para evitar salir por nginx/dominio.
        backend_base = getattr(settings, "BACKEND_INTERNAL_URL", "http://127.0.0.1:8000")
        report_url = f"{backend_base}/api/results/{uuid}/report/print/"

        script_path = os.path.join(
            settings.BASE_DIR, "apps", "base", "scripts", "render_report_pdf.js"
        )

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        out_path = tmp.name
        tmp.close()

        try:
            subprocess.run(
                ["node", script_path, report_url, out_path],
                capture_output=True,
                text=True,
                check=True,
            )

            filename = f"informe_goaiso_{uuid}.pdf"
            resp = FileResponse(open(out_path, "rb"), content_type="application/pdf")
            resp["Content-Disposition"] = f'attachment; filename="{filename}"'
            return resp

        except subprocess.CalledProcessError as e:
            return HttpResponse(
                "Error generando PDF.\n\nSTDOUT:\n"
                + (e.stdout or "")
                + "\n\nSTDERR:\n"
                + (e.stderr or ""),
                status=500,
                content_type="text/plain",
            )
class EvaluationReportSendEmailView(APIView):
    """
    POST /api/results/<uuid>/report/email/
    Envía el PDF al email asociado (InformeDataUsers) o al email que venga en el body.
    Body opcional:
      { "email": "destino@..." }
    """
    permission_classes = [AllowAny]

    def post(self, request, uuid):
        evaluation = get_object_or_404(Evaluation, uuid=uuid)

        # 1) si viene email explícito, lo usamos
        email = (request.data.get("email") or "").strip()

        # 2) si no viene, buscamos el último lead guardado para ese informe
        if not email:
            lead = (
                InformeDataUsers.objects
                .filter(evaluation=evaluation)
                .order_by("-id")
                .first()
            )
            if lead:
                email = (lead.email or "").strip()

        if not email:
            return Response(
                {"ok": False, "error": "No hay email asociado a este informe."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_report_pdf_email(
                to_email=email,
                uuid_str=str(evaluation.uuid),
                product_type=evaluation.product_type,
            )
            return Response({"ok": True, "sent_to": email}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"ok": False, "error": "No se pudo enviar el correo", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
