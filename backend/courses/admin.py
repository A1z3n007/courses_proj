from django.contrib import admin

from .models import (
    Course,
    Module,
    Lesson,
    Progress,
    IntegrationTask,
    UserTask,
    ActivityLog,
    CourseReview,
    Quiz,
    Question,
    Answer,
    QuizResult,
    Achievement,
    UserAchievement,
    FAQCategory,
    FAQItem,
)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ('title', 'order')
    ordering = ('order',)


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0
    fields = ('title', 'order', 'target_minutes')
    ordering = ('order',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'role', 'created_at', 'total_lessons')
    search_fields = ('title', 'description')
    list_filter = ('role',)
    inlines = [ModuleInline, LessonInline]


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'progress_percentage')
    search_fields = ('user__username', 'course__title')
    list_filter = ('course',)
    filter_horizontal = ('completed_lessons',)


@admin.register(IntegrationTask)
class IntegrationTaskAdmin(admin.ModelAdmin):
    list_display = ('description', 'order')
    ordering = ('order',)


@admin.register(UserTask)
class UserTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'completed', 'completed_at')
    list_filter = ('completed', 'task')
    search_fields = ('user__username', 'task__description')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp')
    search_fields = ('user__username', 'action')
    list_filter = ('timestamp',)


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'course__title')


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0
    inlines = [AnswerInline]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('course', 'title')
    inlines = [QuestionInline]


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'created_at')
    search_fields = ('user__username', 'quiz__course__title')


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'awarded_at')
    search_fields = ('user__username', 'achievement__name')


@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(FAQItem)
class FAQItemAdmin(admin.ModelAdmin):
    list_display = ('question', 'category')
    search_fields = ('question',)
    list_filter = ('category',)
