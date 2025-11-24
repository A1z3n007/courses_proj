"""
API views for courses, lessons, and progress.

This module defines endpoints for listing courses, retrieving course
details with their lessons, viewing user progress across courses, and
marking lessons as completed or uncompleted.
"""
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, views, status
from rest_framework.response import Response

from .models import (
    Course,
    Lesson,
    Progress,
    CourseReview,
    IntegrationTask,
    UserTask,
    ActivityLog,
    Quiz,
    Answer,
    QuizResult,
    Achievement,
    UserAchievement,
)
from accounts.models import Profile
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    ProgressSerializer,
    CourseReviewSerializer,
    AdminProgressSerializer,
    UserTaskSerializer,
    ActivityLogSerializer,
    QuizSerializer,
    AchievementSerializer,
    CourseManageSerializer,
)

# Utility function for awarding achievements
def award_achievement(user, code: str, name: str, description: str) -> None:
    """
    Ensure that the given user has the specified achievement. If the
    achievement does not exist, it will be created. If the user has
    already earned it, no action is taken. Returns None.
    """
    # Get or create the achievement by code
    achievement, _ = Achievement.objects.get_or_create(
        code=code,
        defaults={'name': name, 'description': description},
    )
    # Create UserAchievement link if it doesn't already exist
    UserAchievement.objects.get_or_create(user=user, achievement=achievement)


def adjust_daily_goal(progress: Progress, minutes_delta: int) -> None:
    """Update daily goal tracking when lesson completion changes."""
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)

    if progress.last_progress_date != today:
        # When entering a new day, reset minutes and update streak continuity
        if progress.last_goal_met_date != yesterday:
            progress.daily_streak = 0
        progress.daily_minutes_today = 0
        progress.last_progress_date = today
        if progress.last_goal_met_date == today:
            progress.last_goal_met_date = None

    progress.daily_minutes_today = max(0, progress.daily_minutes_today + minutes_delta)

    if progress.daily_minutes_today >= progress.daily_goal_minutes:
        if progress.last_goal_met_date != today:
            if progress.last_goal_met_date == yesterday:
                progress.daily_streak += 1
            else:
                progress.daily_streak = 1
            progress.last_goal_met_date = today
    else:
        if progress.last_goal_met_date == today:
            progress.last_goal_met_date = None
            progress.daily_streak = max(progress.daily_streak - 1, 0)


class CourseListView(generics.ListAPIView):
    """List all available courses."""

    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Course.objects.all().order_by('id')
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        if search:
            # Filter by title or description containing search term (case-insensitive)
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class CourseDetailView(generics.RetrieveAPIView):
    """Retrieve a course with its lessons."""

    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]


class ProgressListView(generics.ListAPIView):
    """List the authenticated user's progress records for all courses."""

    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure progress records exist for each course the user has started.
        return Progress.objects.filter(user=self.request.user).select_related('course')


class LessonCompleteView(views.APIView):
    """Mark a lesson as completed for the current user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id: int, lesson_id: int) -> Response:
        # Validate course and lesson existence
        course = get_object_or_404(Course, id=course_id)
        lesson = get_object_or_404(Lesson, id=lesson_id, course=course)
        # Get or create progress record
        progress, _ = Progress.objects.get_or_create(user=request.user, course=course)
        # Add lesson to completed list
        progress.completed_lessons.add(lesson)
        adjust_daily_goal(progress, lesson.estimated_minutes)
        progress.save()
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action=f"Completed lesson '{lesson.title}' in course '{course.title}'",
        )
        # Award achievement for completing first course
        percent = progress.progress_percentage()
        # If the user finished the course (100% progress), award the first-course achievement
        if percent >= 100.0:
            award_achievement(
                request.user,
                code='first_course',
                name='First Course Completed',
                description='Completed your first course',
            )
        return Response({'detail': 'Lesson marked as completed.'}, status=status.HTTP_200_OK)


class LessonUncompleteView(views.APIView):
    """Mark a lesson as uncompleted for the current user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id: int, lesson_id: int) -> Response:
        course = get_object_or_404(Course, id=course_id)
        lesson = get_object_or_404(Lesson, id=lesson_id, course=course)
        progress = get_object_or_404(Progress, user=request.user, course=course)
        progress.completed_lessons.remove(lesson)
        adjust_daily_goal(progress, -lesson.estimated_minutes)
        progress.save()
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action=f"Marked lesson '{lesson.title}' as uncompleted in course '{course.title}'",
        )
        return Response({'detail': 'Lesson marked as uncompleted.'}, status=status.HTTP_200_OK)


class CourseReviewListCreateView(generics.ListCreateAPIView):
    """
    List existing reviews for a course and allow authenticated users to create a new review.

    Each user can create at most one review per course. If a review already
    exists, attempting to create another will raise an integrity error handled
    by DRF.
    """

    serializer_class = CourseReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        course = get_object_or_404(Course, id=self.kwargs['course_id'])
        return course.reviews.select_related('user')

    def perform_create(self, serializer):
        course = get_object_or_404(Course, id=self.kwargs['course_id'])
        serializer.save(course=course)


class AdminProgressListView(generics.ListAPIView):
    """Admin view to list progress for all users and courses."""

    serializer_class = AdminProgressSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Progress.objects.select_related('user', 'course')


class IntegrationTaskListView(generics.ListAPIView):
    """
    List integration tasks for the authenticated user. Returns the user's
    completion status for each task and an overall progress percentage.
    """

    serializer_class = UserTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure a UserTask exists for each IntegrationTask
        tasks = IntegrationTask.objects.all().order_by('order')
        for task in tasks:
            UserTask.objects.get_or_create(user=self.request.user, task=task)
        return UserTask.objects.filter(user=self.request.user).select_related('task').order_by('task__order')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        total = queryset.count()
        completed = queryset.filter(completed=True).count()
        progress = (completed / total) * 100 if total else 0.0
        return Response({'progress': progress, 'tasks': serializer.data})


class UserTaskToggleView(views.APIView):
    """
    Toggle the completion status of a user's integration task.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id: int) -> Response:
        task = get_object_or_404(IntegrationTask, id=task_id)
        user_task, _ = UserTask.objects.get_or_create(user=request.user, task=task)
        user_task.completed = not user_task.completed
        if user_task.completed:
            from django.utils import timezone
            user_task.completed_at = timezone.now()
            # Log completion activity
            ActivityLog.objects.create(
                user=request.user,
                action=f"Completed task '{task.description}'",
            )
        else:
            user_task.completed_at = None
            ActivityLog.objects.create(
                user=request.user,
                action=f"Marked task '{task.description}' as not completed",
            )
        user_task.save()
        return Response({'completed': user_task.completed})


class ActivityLogListView(generics.ListAPIView):
    """Return the most recent activity logs for the authenticated user."""

    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Limit to last 10 entries
        return ActivityLog.objects.filter(user=self.request.user).order_by('-timestamp')[:10]


# ---------- Quiz views ----------

class QuizView(views.APIView):
    """
    Retrieve the quiz associated with a specific course. Only authenticated
    users can access quizzes. Returns 404 if the course does not have a
    quiz defined.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id: int) -> Response:
        course = get_object_or_404(Course, id=course_id)
        # Try to access the quiz via the related name; if not present, 404
        try:
            quiz = course.quiz
        except Quiz.DoesNotExist:
            quiz = None
        if not quiz:
            return Response({'detail': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)


class QuizSubmitView(views.APIView):
    """
    Submit answers for a quiz associated with a course. The request data
    should contain a mapping of question IDs to selected answer IDs under
    the key ``answers``. The endpoint calculates the score, stores the
    result, logs the activity, and awards an achievement for completing a
    quiz. The response includes the user's score and the total number of
    questions.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id: int) -> Response:
        course = get_object_or_404(Course, id=course_id)
        try:
            quiz = course.quiz
        except Quiz.DoesNotExist:
            return Response({'detail': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)
        answers = request.data.get('answers', {}) or {}
        correct = 0
        total = quiz.questions.count()
        for question in quiz.questions.all():
            answer_id = answers.get(str(question.id))
            if answer_id:
                # Check if the selected answer is correct
                try:
                    ans = Answer.objects.get(id=answer_id, question=question)
                    if ans.is_correct:
                        correct += 1
                except Answer.DoesNotExist:
                    pass
        score = correct
        # Save or update quiz result
        QuizResult.objects.update_or_create(
            user=request.user, quiz=quiz, defaults={'score': score}
        )
        # Log the activity
        ActivityLog.objects.create(
            user=request.user,
            action=f"Completed quiz for course '{course.title}' with score {score}/{total}",
        )
        # Award achievement for completing first quiz
        award_achievement(
            request.user,
            code='first_quiz',
            name='First Quiz Completed',
            description='Completed your first course quiz',
        )
        return Response({'score': score, 'total': total})


# ---------- Achievement view ----------

class AchievementListView(generics.ListAPIView):
    """
    List all defined achievements along with an ``awarded`` flag indicating
    whether the current user has earned each one. Only authenticated
    users can view achievements.
    """

    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Achievement.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Include request in context for the serializer to determine award status
        context.update({'request': self.request})
        return context


# ---------- Recommended courses view ----------

class RecommendedCourseListView(generics.ListAPIView):
    """
    Recommend courses for the current user based on their role (department)
    and existing progress records. Courses already started or completed are
    excluded from the recommendations. If the user's profile department
    matches one of the course role choices (welder, manager, seller),
    recommendations are limited to that role. Otherwise, all courses not
    yet started are returned. At most 5 courses are returned.
    """

    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Courses with existing progress records (started or completed)
        started_course_ids = set(
            Progress.objects.filter(user=user).values_list('course_id', flat=True)
        )
        role = None
        # Determine role from profile.department if it matches a known course role
        try:
            profile = user.profile
            department = (profile.department or '').lower()
            # Build mapping from choices to keys
            valid_roles = {k: v for k, v in Course.ROLE_CHOICES}
            if department in valid_roles:
                role = department
        except Profile.DoesNotExist:
            pass
        queryset = Course.objects.exclude(id__in=started_course_ids)
        if role:
            queryset = queryset.filter(role=role)
        return queryset.order_by('id')[:5]


class CourseManageView(generics.CreateAPIView):
    """Allow staff members to create courses along with lessons."""

    serializer_class = CourseManageSerializer
    permission_classes = [permissions.IsAdminUser]
