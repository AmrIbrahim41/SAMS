from django.contrib import admin
from .models import Section, Video, CommitteeMember, Supervisor, SeminarItem, Participant


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("key", "title_ar", "icon", "order", "is_published", "updated_at")
    list_editable = ("order", "is_published")
    search_fields = ("key", "title_ar", "title_en")


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "order", "is_published", "created_at")
    list_editable = ("order", "is_published")
    search_fields = ("title", "description")


@admin.register(SeminarItem)
class SeminarItemAdmin(admin.ModelAdmin):
    list_display = ("__str__", "kind", "order", "is_published", "created_at")
    list_editable = ("order", "is_published")
    list_filter = ("kind", "is_published")


@admin.register(Supervisor)
class SupervisorAdmin(admin.ModelAdmin):
    list_display = ("name", "title", "order", "is_published")
    list_editable = ("order", "is_published")
    search_fields = ("name", "title")


@admin.register(CommitteeMember)
class CommitteeMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "committee", "role", "major", "order", "is_published")
    list_editable = ("order", "is_published")
    list_filter = ("committee", "role", "is_published")
    search_fields = ("name", "major", "branch")


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("name", "committee", "branch", "year", "points", "is_published")
    list_editable = ("points", "is_published")
    list_filter = ("committee", "branch", "year", "is_published")
    search_fields = ("name",)
    ordering = ("committee", "-points")
