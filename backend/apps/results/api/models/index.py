import uuid
from django.db import models


class Evaluation(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "PENDING"),
        ("PROCESSING", "PROCESSING"),
        ("SUCCESS", "SUCCESS"),
        ("ERROR", "ERROR"),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    product_type = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    country = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=150, null=True, blank=True)


    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.product_type} ({self.uuid})"

class InformeDataUsers(models.Model):
    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name="informe_data_users",default=1
    )
    nombre = models.CharField(max_length=255)
    email = models.EmailField()
    movil = models.CharField(max_length=20)
    
    def __str__(self):
        return f"{self.nombre} <{self.email}>"
class EvaluationCriterion(models.Model):
    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name="criteria"
    )

    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.name} ({self.evaluation.uuid})"


class PromptRun(models.Model):
    PHASE_CHOICES = [
        ("PHASE1", "PHASE1"),
        ("PHASE2", "PHASE2"),
    ]

    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name="prompt_runs"
    )

    phase = models.CharField(max_length=10, choices=PHASE_CHOICES)
    criterion = models.ForeignKey(
        EvaluationCriterion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prompt_runs",
    )

    prompt_text = models.TextField()
    response_raw = models.TextField(null=True, blank=True)

    # ✅ AQUI guardamos transparencia y “data real”
    sources = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phase} ({self.evaluation.uuid})"


class RankingItem(models.Model):
    prompt_run = models.ForeignKey(
        PromptRun, on_delete=models.CASCADE, related_name="items"
    )

    position = models.PositiveIntegerField()  # 1..5
    brand = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    raw_text = models.CharField(max_length=500)

    def __str__(self):
        return f"{self.brand} {self.model} ({self.position})"


class RankingSummary(models.Model):
    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name="summary"
    )

    phase = models.CharField(max_length=10)
    criterion = models.ForeignKey(
        EvaluationCriterion, on_delete=models.SET_NULL, null=True, blank=True
    )

    brand = models.CharField(max_length=255)
    score = models.IntegerField(default=0)
    share = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.phase} {self.brand} ({self.evaluation.uuid})"


