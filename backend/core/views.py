from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Section, Video, CommitteeMember, Supervisor, SeminarItem, Participant
from .serializers import (
    SectionSerializer, VideoSerializer, CommitteeMemberSerializer,
    SupervisorSerializer, SeminarItemSerializer, ParticipantSerializer,
)


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # الزوار يشوفوا المنشور فقط؛ الأدمن يشوف الكل
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]


class CommitteeMemberViewSet(viewsets.ModelViewSet):
    queryset = CommitteeMember.objects.all()
    serializer_class = CommitteeMemberSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "major", "branch"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        # فلترة اختيارية باللجنة و/أو الدور عبر query params
        committee = self.request.query_params.get("committee")
        if committee:
            qs = qs.filter(committee=committee)
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]


class SupervisorViewSet(viewsets.ModelViewSet):
    queryset = Supervisor.objects.all()
    serializer_class = SupervisorSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]


class SeminarItemViewSet(viewsets.ModelViewSet):
    queryset = SeminarItem.objects.all()
    serializer_class = SeminarItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]


class ParticipantViewSet(viewsets.ModelViewSet):
    """لوحة النقاط: الأدمن يدير الكل، الزوار يشوفوا المنشور فقط + endpoint عام للتوب 5."""
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        committee = self.request.query_params.get("committee")
        if committee:
            qs = qs.filter(committee=committee)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve", "top"):
            return [AllowAny()]
        return [IsAdminUser()]

    @action(detail=False, methods=["get"])
    def top(self, request):
        """أعلى 5 (منشورين) في كل لجنة، مرتّبين تنازليًا بالنقاط. الناتج: {committee_key: [...]}"""
        limit = int(request.query_params.get("limit", 5))
        result = {}
        published = Participant.objects.filter(is_published=True)
        committees = published.values_list("committee", flat=True).distinct()
        for key in committees:
            rows = published.filter(committee=key).order_by("-points", "name")[:limit]
            result[key] = ParticipantSerializer(rows, many=True).data
        return Response(result)
