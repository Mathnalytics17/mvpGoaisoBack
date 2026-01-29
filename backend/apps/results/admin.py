from django.contrib import admin
from apps.results.api.models.index import Evaluation
# Register your models here.

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    pass