from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SectionViewSet, VideoViewSet, CommitteeMemberViewSet,
    SupervisorViewSet, SeminarItemViewSet,
)

router = DefaultRouter()
router.register(r"sections", SectionViewSet)
router.register(r"videos", VideoViewSet)
router.register(r"committee-members", CommitteeMemberViewSet)
router.register(r"supervisors", SupervisorViewSet)
router.register(r"seminar", SeminarItemViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
