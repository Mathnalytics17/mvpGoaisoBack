from rest_framework import serializers
from apps.results.api.models.index import (
    Evaluation,
    EvaluationCriterion,
    PromptRun,
    RankingItem,
    RankingSummary
)


from rest_framework import serializers
from apps.results.api.models.index import InformeDataUsers



class EvaluationCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriterion
        fields = ["id", "name", "order"]


class RankingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RankingItem
        fields = ["id", "position", "brand", "model", "raw_text"]


class PromptRunSerializer(serializers.ModelSerializer):
    items = RankingItemSerializer(many=True, read_only=True)

    class Meta:
        model = PromptRun
        fields = [
            "id",
            "phase",
            "criterion",
            "prompt_text",
            "response_raw",
            "created_at",
            "items",
        ]


class RankingSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = RankingSummary
        fields = ["id", "phase", "criterion", "brand", "score", "share"]


class EvaluationSerializer(serializers.ModelSerializer):
    criteria = EvaluationCriterionSerializer(many=True, read_only=True)
    prompt_runs = PromptRunSerializer(many=True, read_only=True)
    summary = RankingSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            "uuid",
            "product_type",
            "status",
            "created_at",
            "completed_at",
            "criteria",
            "prompt_runs",
            "summary",
        ]


class EvaluationCreateSerializer(serializers.Serializer):
    product_type = serializers.CharField()
    criteria = serializers.ListField(
        child=serializers.CharField(), min_length=1, max_length=5
    )

    country = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)



class InformeDataUsersCreateSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    nombre = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    movil = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_nombre(self, v):
        v = v.strip()
        if not v:
            raise serializers.ValidationError("Nombre obligatorio.")
        return v

    def validate_movil(self, v):
        return (v or "").strip()

    def create(self, validated_data):
        uuid = validated_data["uuid"]
        evaluation = Evaluation.objects.filter(uuid=uuid).first()
        if not evaluation:
            raise serializers.ValidationError({"uuid": "Evaluation no encontrada."})

        lead = InformeDataUsers.objects.create(
            evaluation=evaluation,
            nombre=validated_data["nombre"],
            email=validated_data["email"],
            movil=validated_data.get("movil", "") or "",
        )
        return lead


class InformeDataUsersListSerializer(serializers.ModelSerializer):
    evaluation_uuid = serializers.SerializerMethodField()

    class Meta:
        model = InformeDataUsers
        fields = ["id", "evaluation_uuid", "nombre", "email", "movil"]

    def get_evaluation_uuid(self, obj):
        return str(obj.evaluation.uuid) if obj.evaluation_id else ""