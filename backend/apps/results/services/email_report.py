# apps/results/services/email_report.py
import os
import tempfile
import subprocess

from django.conf import settings
from django.core.mail import EmailMessage, get_connection


def generate_report_pdf_for_uuid(uuid_str: str) -> tuple[str, str]:
    backend_base = getattr(settings, "BACKEND_INTERNAL_URL", "http://127.0.0.1:8000")
    report_url = f"{backend_base}/api/results/{uuid_str}/report/print/"

    script_path = os.path.join(settings.BASE_DIR, "apps", "base", "scripts", "render_report_pdf.js")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    out_path = tmp.name
    tmp.close()

    proc = subprocess.run(
        ["node", script_path, report_url, out_path],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Puppeteer failed: {proc.stderr}\nSTDOUT:\n{proc.stdout}")

    filename = f"informe_goaiso_{uuid_str}.pdf"
    return out_path, filename


def send_report_pdf_email(to_email: str, uuid_str: str, product_type: str | None = None) -> None:
    if not getattr(settings, "EMAIL_HOST", ""):
        raise RuntimeError("EMAIL_HOST vacío en runtime (ENV no cargó en producción).")

    pdf_path, filename = generate_report_pdf_for_uuid(uuid_str)

    subject = f"Informe goAISO — {product_type or uuid_str}"
    body = (
        "Hola,\n\n"
        "Adjunto encontrarás tu informe goAISO en PDF.\n\n"
        f"UUID: {uuid_str}\n"
        "— goAISO"
    )

    connection = get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=settings.EMAIL_HOST,
        port=settings.EMAIL_PORT,
        username=settings.EMAIL_HOST_USER,
        password=settings.EMAIL_HOST_PASSWORD,
        use_tls=settings.EMAIL_USE_TLS,
        fail_silently=False,
    )

    try:
        connection.open()

        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
            connection=connection,
        )

        with open(pdf_path, "rb") as f:
            msg.attach(filename, f.read(), "application/pdf")

        msg.send()

    finally:
        try:
            connection.close()
        except Exception:
            pass
        try:
            os.remove(pdf_path)
        except Exception:
            pass
