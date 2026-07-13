from rest_framework import serializers
from .models import Section, Video, CommitteeMember, Supervisor, SeminarItem


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = "__all__"
        read_only_fields = ["created_at"]


class CommitteeMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommitteeMember
        fields = "__all__"
        read_only_fields = ["created_at"]


class SupervisorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supervisor
        fields = "__all__"
        read_only_fields = ["created_at"]


class SeminarItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeminarItem
        fields = "__all__"
        read_only_fields = ["created_at"]
