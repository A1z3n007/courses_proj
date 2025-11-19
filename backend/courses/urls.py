"""
URL patterns for the courses app.
"""
from django.urls import path

from .views import (
    CourseListView,
    CourseDetailView,
    ProgressListView,
    LessonCompleteView,
    LessonUncompleteView,
    CourseReviewListCreateView,
    AdminProgressListView,
    IntegrationTaskListView,
    UserTaskToggleView,
    ActivityLogListView,
    QuizView,
    QuizSubmitView,
    AchievementListView,
    RecommendedCourseListView,
)


urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('progress/', ProgressListView.as_view(), name='progress-list'),
    path('<int:course_id>/lessons/<int:lesson_id>/complete/', LessonCompleteView.as_view(), name='lesson-complete'),
    path('<int:course_id>/lessons/<int:lesson_id>/uncomplete/', LessonUncompleteView.as_view(), name='lesson-uncomplete'),
    # Reviews for a course
    path('<int:course_id>/reviews/', CourseReviewListCreateView.as_view(), name='course-reviews'),
    # Admin progress listing
    path('admin/progress/', AdminProgressListView.as_view(), name='admin-progress'),
    # Integration tasks and activity log
    path('integration/tasks/', IntegrationTaskListView.as_view(), name='integration-task-list'),
    path('integration/tasks/<int:task_id>/toggle/', UserTaskToggleView.as_view(), name='integration-task-toggle'),
    path('activities/', ActivityLogListView.as_view(), name='activity-log-list'),

    # Quiz endpoints
    path('<int:course_id>/quiz/', QuizView.as_view(), name='quiz-detail'),
    path('<int:course_id>/quiz/submit/', QuizSubmitView.as_view(), name='quiz-submit'),

    # Achievements
    path('achievements/', AchievementListView.as_view(), name='achievement-list'),

    # Recommended courses
    path('recommended/', RecommendedCourseListView.as_view(), name='recommended-courses'),
]