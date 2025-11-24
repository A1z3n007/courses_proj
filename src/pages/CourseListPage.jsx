import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';

const roleOptions = [
  { value: 'all', label: 'Все роли' },
  { value: 'welder', label: 'Сварщик' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'seller', label: 'Продавец' },
];

const roleLabels = roleOptions.reduce((acc, option) => {
  if (option.value !== 'all') {
    acc[option.value] = option.label;
  }
  return acc;
}, {});

const statusLabels = {
  all: 'Все статусы',
  not_started: 'Ещё не начат',
  in_progress: 'В процессе',
  completed: 'Завершён',
};

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [progresses, setProgresses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const params = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      setLoadingCourses(true);
      api
        .get('/courses/', { params, signal: controller.signal })
        .then((resp) => {
          if (!isMounted) return;
          const data = Array.isArray(resp.data)
            ? resp.data
            : Array.isArray(resp.data?.results)
            ? resp.data.results
            : [];
          setCourses(data);
        })
        .catch((err) => {
          if (err?.code === 'ERR_CANCELED') {
            return;
          }
          console.error('Failed to load courses', err);
        })
        .finally(() => {
          if (isMounted) {
            setLoadingCourses(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/courses/progress/')
      .then((resp) => {
        if (!isMounted) return;
        const data = Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp.data?.results)
          ? resp.data.results
          : [];
        setProgresses(data);
      })
      .catch((err) => {
        console.error('Failed to load progress list', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const progressByCourse = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(progresses)) return map;
    progresses.forEach((record) => {
      if (record?.course?.id) {
        map.set(record.course.id, record);
      }
    });
    return map;
  }, [progresses]);

  const resolveStatus = (courseId) => {
    const record = progressByCourse.get(courseId);
    if (!record) {
      return 'not_started';
    }
    const progressValue =
      typeof record.progress === 'number' ? record.progress : Number(record.progress) || 0;
    if (progressValue >= 100) {
      return 'completed';
    }
    return 'in_progress';
  };

  const filteredCourses = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    return list.filter((course) => {
      if (statusFilter === 'all') {
        return true;
      }
      return resolveStatus(course.id) === statusFilter;
    });
  }, [courses, statusFilter, progressByCourse]);

  const progressSummary = useMemo(() => {
    if (!Array.isArray(progresses) || progresses.length === 0) {
      return null;
    }
    const totalProgress = progresses.reduce(
      (acc, record) => acc + (typeof record.progress === 'number' ? record.progress : 0),
      0,
    );
    const minutesRemaining = progresses.reduce(
      (acc, record) => acc + Math.max(record.minutes_remaining ?? 0, 0),
      0,
    );
    const streak = progresses.reduce(
      (acc, record) => Math.max(acc, record.daily_streak || 0),
      0,
    );
    const goalMet = progresses.some((record) => (record.minutes_remaining || 0) === 0);
    return {
      averageProgress: totalProgress / progresses.length,
      minutesRemaining,
      streak,
      goalMet,
    };
  }, [progresses]);

  const handleToggleCourse = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    if (!detailsCache[courseId]) {
      setDetailLoading(courseId);
      api
        .get(`/courses/${courseId}/`)
        .then((resp) => {
          setDetailsCache((prev) => ({ ...prev, [courseId]: resp.data }));
        })
        .catch((err) => {
          console.error('Failed to load course details', err);
        })
        .finally(() => {
          setDetailLoading(null);
        });
    }
  };

  const renderModules = (courseId) => {
    if (detailLoading === courseId && !detailsCache[courseId]) {
      return <p className="muted">Загружаем структуру курса…</p>;
    }
    const details = detailsCache[courseId];
    if (!details) {
      return <p className="muted">Нажмите «Структура курса», чтобы увидеть модули.</p>;
    }
    if (!details.modules?.length) {
      return <p className="muted">Для курса пока не создано модулей.</p>;
    }
    return (
      <ul className="modules-list">
        {details.modules.map((module) => (
          <li key={module.id} className="module-chip">
            <div className="module-chip__head">
              <strong>{module.title}</strong>
              <span>≈ {module.target_minutes} мин</span>
            </div>
            <p className="muted">
              {module.description || 'Текст урока появится при редактировании.'}
            </p>
            {module.lessons?.length ? (
              <p className="module-chip__lessons">
                {module.lessons.length} урок(ов):{' '}
                {module.lessons.map((lesson) => lesson.title).join(', ')}
              </p>
            ) : (
              <p className="module-chip__lessons muted">Уроки ещё не добавлены.</p>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Каталог</p>
          <h1>Курсы и спринты для адаптации</h1>
          <p className="muted">
            Подберите программу под вашу роль, отслеживайте прогресс по модулям и закрывайте
            ежедневные цели, чтобы быстрее пройти онбординг.
          </p>
        </div>
        <div className="page-header__actions">
          <Link to="/" className="btn btn--ghost">
            На главную
          </Link>
          <Link to="/admin/courses/new" className="btn btn--secondary">
            Создать курс
          </Link>
        </div>
      </header>

      {progressSummary && (
        <section className="card card--inline daily-goal-card">
          <div>
            <p className="eyebrow">Ежедневная цель</p>
            <h2>
              {progressSummary.goalMet
                ? 'Цель на сегодня выполнена'
                : `Осталось ${progressSummary.minutesRemaining} мин`}
            </h2>
            <p className="muted">
              {progressSummary.goalMet
                ? `Серия уже ${progressSummary.streak} ${
                    progressSummary.streak === 1 ? 'день' : 'дней'
                  }. Можно перейти к следующему модулю.`
                : 'Закройте цель хотя бы по одному курсу, чтобы увеличить серию.'}
            </p>
            <div className="chip-row">
              <span className="tag">Серия: {progressSummary.streak} д.</span>
              <span className="tag tag--ghost">
                Средний прогресс: {progressSummary.averageProgress.toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <ProgressBar progress={progressSummary.averageProgress} />
            <p className="muted">
              {Array.isArray(progresses) ? progresses.length : 0} активн. курс(ов): держите темп по
              каждому модулю.
            </p>
          </div>
        </section>
      )}

      <section className="card">
        <div className="filters">
          <input
            type="text"
            className="input"
            placeholder="Поиск по названию или описанию"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loadingCourses ? (
          <Loader label="Собираем подходящие курсы…" />
        ) : filteredCourses.length === 0 ? (
          <p>По выбранным условиям курсы не найдены. Попробуйте изменить фильтры.</p>
        ) : (
          <div className="list list--gap">
            {filteredCourses.map((course) => {
              const record = progressByCourse.get(course.id);
              const progressValue =
                typeof record?.progress === 'number'
                  ? record.progress
                  : Number(record?.progress) || 0;
              const minutesRemaining = record
                ? record.minutes_remaining ?? record.daily_goal_minutes ?? 0
                : null;
              const statusKey = resolveStatus(course.id);
              const nextStep =
                statusKey === 'completed'
                  ? 'Курс завершён — можно повторить тест или выбрать новый.'
                  : record
                  ? minutesRemaining <= 0
                    ? 'Ежедневная цель достигнута. Закрепите знания тестом или следующими модулями.'
                    : `Осталось ${minutesRemaining} мин до цели на сегодня.`
                  : 'Начните с первого модуля и отслеживайте прогресс.';
              const isExpanded = expandedCourse === course.id;

              return (
                <article key={course.id} className="card course-card course-card--catalog">
                  <div>
                    <h3>{course.title}</h3>
                    <p className="muted">{course.description}</p>
                    <div className="chip-row">
                      <span className="tag tag--ghost">
                        {roleLabels[course.role] || course.role}
                      </span>
                      <span className="tag">{statusLabels[statusKey]}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <ProgressBar progress={progressValue} />
                      <p className="muted">
                        {progressValue.toFixed(0)}% пройдено • {nextStep}
                      </p>
                    </div>
                  </div>
                  <div className="course-card__actions">
                    <Link className="btn btn--secondary" to={`/courses/${course.id}`}>
                      {statusKey === 'not_started' ? 'Начать' : 'Продолжить'}
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => handleToggleCourse(course.id)}
                    >
                      {isExpanded ? 'Скрыть структуру' : 'Структура курса'}
                    </button>
                  </div>
                  {isExpanded && <div className="modules-preview">{renderModules(course.id)}</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
