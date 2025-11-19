"""
Serializers for the courses app.

These serializers define how courses, lessons, and progress data are
converted between Python objects and JSON. Nested serializers are
used to embed lessons within a course detail response.
"""
from rest_framework import serializers

from .models import (
    Course,
    Lesson,
    Progress,
    CourseReview,
    UserTask,
    ActivityLog,
    Quiz,
    Question,
    Answer,
    Achievement,
)
from django.db.models import Avg


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson objects."""

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'video_url', 'order']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for listing courses."""

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'role']


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for retrieving course details with nested lessons."""
    lessons = LessonSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'role', 'lessons', 'average_rating', 'has_quiz']

    def get_average_rating(self, obj) -> float:
        # Calculate the average rating for the course. If no reviews, return None.
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(avg, 2) if avg is not None else None

    def get_has_quiz(self, obj) -> bool:
        """Return True if a quiz is associated with this course."""
        try:
            return hasattr(obj, 'quiz') and obj.quiz is not None
        except Exception:
            return False


class ProgressSerializer(serializers.ModelSerializer):
    """
    Serializer for Progress objects. Calculates the progress percentage and
    returns IDs of completed lessons.
    """
    course = CourseSerializer(read_only=True)
    progress = serializers.SerializerMethodField()
    completed_lessons = serializers.PrimaryKeyRelatedField(
        many=True, read_only=True, source='completed_lessons'
    )

    class Meta:
        model = Progress
        fields = ['id', 'course', 'progress', 'completed_lessons']

    def get_progress(self, obj) -> float:
        return obj.progress_percentage()


class CourseReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseReview. The user field is read-only and displays the
    username of the reviewer.
    """
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CourseReview
        fields = ['id', 'user', 'rating', 'comment', 'created_at']

    def create(self, validated_data):
        request = self.context['request']
        return CourseReview.objects.create(user=request.user, **validated_data)


class AdminProgressSerializer(serializers.ModelSerializer):
    """
    Serializer for admin progress listing that includes the username.
    """
    user = serializers.CharField(source='user.username', read_only=True)
    course = CourseSerializer(read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Progress
        fields = ['id', 'user', 'course', 'progress']

    def get_progress(self, obj) -> float:
        return obj.progress_percentage()


class UserTaskSerializer(serializers.ModelSerializer):
    """Serializer for user integration tasks with the task details."""
    task_id = serializers.IntegerField(source='task.id', read_only=True)
    description = serializers.CharField(source='task.description', read_only=True)
    order = serializers.IntegerField(source='task.order', read_only=True)
    completed_at = serializers.DateTimeField(allow_null=True, read_only=True)

    class Meta:
        model = UserTask
        fields = ['task_id', 'description', 'order', 'completed', 'completed_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs."""

    class Meta:
        model = ActivityLog
        fields = ['id', 'action', 'timestamp']

# ---------- Quiz and achievement serializers ----------

class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for answer options in a quiz question.

    The `is_correct` flag is intentionally omitted to avoid revealing the
    correct answer to the client. Only the answer ID and display text are
    exposed.
    """

    class Meta:
        model = Answer
        fields = ['id', 'text']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for quiz questions with nested answer options."""
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'answers']


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for a quiz, including its questions and answer options."""
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'questions']


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for achievements with an awarded flag.

    The `awarded` field indicates whether the requesting user has already
    received this achievement. This relies on the serializer context
    containing the request object.
    """
    awarded = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ['id', 'code', 'name', 'description', 'awarded']

    def get_awarded(self, obj) -> bool:
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or user.is_anonymous:
            return False
        # If the user has a UserAchievement link for this achievement, return True
        return obj.users.filter(user=user).exists()