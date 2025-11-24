"""
Models for the courses app.

This module defines Course, Lesson and Progress models. Courses contain
multiple lessons, and each user has a Progress record per course that
tracks which lessons have been completed.
"""
from django.db import models
from django.contrib.auth.models import User


class Course(models.Model):
    """Represents a training course."""

    ROLE_CHOICES = [
        ('welder', 'Welder'),
        ('manager', 'Manager'),
        ('seller', 'Seller'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='welder')

    def __str__(self) -> str:
        return self.title

    def total_lessons(self) -> int:
        return self.lessons.count()


class Module(models.Model):
    """Logical section (module/sprint) inside a course."""

    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    target_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f"{self.course.title} - {self.title}"


class Lesson(models.Model):
    """Represents a lesson within a course."""

    course = models.ForeignKey(Course, related_name='lessons', on_delete=models.CASCADE)
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    image_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    estimated_minutes = models.PositiveIntegerField(default=10)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f"{self.course.title} - {self.title}"


class Progress(models.Model):
    """
    Tracks a user's progress in a course by storing which lessons
    have been completed.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress_records')
    completed_lessons = models.ManyToManyField(Lesson, blank=True, related_name='completed_by')
    updated_at = models.DateTimeField(auto_now=True)
    daily_goal_minutes = models.PositiveIntegerField(default=10)
    daily_minutes_today = models.PositiveIntegerField(default=0)
    daily_streak = models.PositiveIntegerField(default=0)
    last_progress_date = models.DateField(null=True, blank=True)
    last_goal_met_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self) -> str:
        return f"{self.user.username} - {self.course.title}"

    def progress_percentage(self) -> float:
        total = self.course.total_lessons()
        if total == 0:
            return 0.0
        completed = self.completed_lessons.count()
        return (completed / total) * 100


class CourseReview(models.Model):
    """
    Represents a user's review and rating of a course. Each user can leave
    exactly one review per course. Ratings are positive integers (1-5).
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Review by {self.user.username} for {self.course.title}"


# ---------- Integration tasks and activity logging ----------

class IntegrationTask(models.Model):
    """A single task in the onboarding/integration plan.

    These tasks are defined by the company and are assigned to every new
    employee. Examples include watching an introductory video or reading a
    policy document.
    """

    description = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self) -> str:
        return self.description


class UserTask(models.Model):
    """
    Links a user to an integration task and tracks whether it has been
    completed.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_tasks')
    task = models.ForeignKey(IntegrationTask, on_delete=models.CASCADE, related_name='user_tasks')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'task')

    def __str__(self) -> str:
        return f"{self.user.username} - {self.task.description}"


class ActivityLog(models.Model):
    """
    Stores a record of a user's actions within the system. Used for the
    activity feed on the dashboard.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self) -> str:
        return f"{self.timestamp}: {self.user.username} - {self.action}"


# ---------- Quiz models ----------

class Quiz(models.Model):
    """A quiz associated with a course."""
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255, default='Quiz')

    def __str__(self) -> str:
        return f"Quiz for {self.course.title}"


class Question(models.Model):
    """A question in a quiz."""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=1024)

    def __str__(self) -> str:
        return self.text


class Answer(models.Model):
    """An answer option for a question."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=512)
    is_correct = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.text


class QuizResult(models.Model):
    """Stores the result of a user taking a quiz."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_results')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='results')
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'quiz')

    def __str__(self) -> str:
        return f"{self.user.username} - {self.quiz.course.title} ({self.score})"


# ---------- Achievement models ----------

class Achievement(models.Model):
    """Represents a badge or achievement that a user can earn."""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name


class UserAchievement(models.Model):
    """Links a user to an earned achievement."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='users')
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')

    def __str__(self) -> str:
        return f"{self.user.username} - {self.achievement.name}"


# ---------- FAQ models ----------

class FAQCategory(models.Model):
    """Category for frequently asked questions."""
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name


class FAQItem(models.Model):
    """A frequently asked question and its answer."""
    category = models.ForeignKey(FAQCategory, on_delete=models.CASCADE, related_name='items')
    question = models.CharField(max_length=1024)
    answer = models.TextField()

    def __str__(self) -> str:
        return self.question
