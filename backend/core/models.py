from django.db import models


class Section(models.Model):
    """بلوك محتوى قابل للتحكم من الداش بورد (عربي/إنجليزي)."""
    key = models.CharField(max_length=60, unique=True, help_text="أي اسم مميّز للقسم (مثل: hero للصفحة الرئيسية). يقبل عربي ومسافات.")
    title_ar = models.CharField(max_length=200, blank=True)
    title_en = models.CharField(max_length=200, blank=True)
    body_ar = models.TextField(blank=True)
    body_en = models.TextField(blank=True)
    image = models.ImageField(upload_to="sections/", blank=True, null=True)
    icon = models.CharField(max_length=8, blank=True, help_text="إيموجي أو رمز للكارت")
    link_url = models.CharField(max_length=300, blank=True, help_text="رابط زر اختياري")
    link_label = models.CharField(max_length=60, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title_ar or self.key


class Video(models.Model):
    """فيديو مرفوع كملف على السيرفر."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="videos/")
    thumbnail = models.ImageField(upload_to="thumbnails/", blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title


class SeminarItem(models.Model):
    """عنصر في قسم الندوة التعريفية — صورة أو فيديو (مرفوع أو رابط يوتيوب)."""
    KIND_CHOICES = [("image", "صورة"), ("video", "فيديو")]

    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="image")
    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="seminar/", blank=True, null=True, help_text="الصورة، أو صورة الغلاف لفيديو الرابط")
    video = models.FileField(upload_to="seminar/", blank=True, null=True, help_text="ملف فيديو مرفوع (mp4)")
    url = models.CharField(max_length=400, blank=True, help_text="رابط فيديو خارجي (يوتيوب مثلاً)")
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title or f"{self.get_kind_display()} #{self.pk}"


class Supervisor(models.Model):
    """مشرف أو دكتور مسؤول عن المشروع — كارت يُدار من الأدمن."""
    name = models.CharField(max_length=120)
    title = models.CharField(max_length=160, blank=True, help_text="الصفة العلمية / المنصب، مثل: أستاذ دكتور — المشرف العام")
    bio = models.TextField(blank=True, help_text="نبذة")
    photo = models.ImageField(upload_to="supervisors/", blank=True, null=True)
    link = models.CharField(max_length=300, blank=True, help_text="رابط تعريفي اختياري (لينكدإن مثلاً)")
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name


class CommitteeMember(models.Model):
    """عضو داخل إحدى لجان فريق العمل. اللجان ثابتة في الكود، والأشخاص يُضافون من الأدمن."""

    COMMITTEE_CHOICES = [
        ("assembly", "لجنة الجمعية العمومية"),
        ("design", "لجنة التصميم"),
        ("central-bank", "لجنة البنك المركزي"),
        ("social", "لجنة السوشيال ميديا والتسويق"),
        ("board", "لجنة مجلس الإدارة"),
        ("audit", "لجنة مراقبة الحسابات"),
        ("shareholders", "لجنة المساهمين (الرعاة)"),
        ("photography", "لجنة التصوير"),
    ]
    ROLE_CHOICES = [
        ("head", "Head"),
        ("co_head", "Co-Head"),
        ("coordinator", "Coordinator"),
        ("member", "Member"),
        ("organizer", "Organizer"),
    ]

    committee = models.CharField(max_length=40, choices=COMMITTEE_CHOICES)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    name = models.CharField(max_length=120)
    photo = models.ImageField(upload_to="members/", blank=True, null=True)
    branch = models.CharField(max_length=120, blank=True, help_text="الفرع + الفرقة")
    major = models.CharField(max_length=120, blank=True, help_text="التخصص")
    bio = models.TextField(blank=True, help_text="نبذة (للقيادة أساسًا)")
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["committee", "role", "order", "id"]

    def __str__(self):
        return f"{self.get_committee_display()} — {self.name} ({self.get_role_display()})"
