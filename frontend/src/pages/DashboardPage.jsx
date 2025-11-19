import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';

export default function DashboardPage() {
  const [progresses, setProgresses] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [tasksData, setTasksData] = useState({ progress: 0, tasks: [] });
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const profileResp = await api.get('/accounts/profile/');
        if (!active) {
          return;
        }
        setProfile(profileResp.data);
        setIsStaff(profileResp.data.is_staff);
        const [progressResp, tasksResp, activityResp, achievementResp, recommendedResp] =
          await Promise.all([
            api.get('/courses/progress/'),
            api.get('/courses/integration/tasks/'),
            api.get('/courses/activities/'),
            api.get('/courses/achievements/'),
            api.get('/courses/recommended/'),
          ]);
        if (!active) {
          return;
        }
        setProgresses(progressResp.data);
        setTasksData(tasksResp.data);
        setActivities(activityResp.data);
        setAchievements(achievementResp.data);
        setRecommended(recommendedResp.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const formatDate = (value) => {
    if (!value) {
      return 'Не указано';
    }
    return new Date(value).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const profileName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
      profile.username
    : '';

  if (loading) {
    return (
      <div className="page">
        <Loader label="Загружаем личный кабинет..." />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Онбординг сотрудников</p>
          <h1>Личный кабинет</h1>
          <p className="muted">
            Следите за прогрессом, отмечайте уроки и получайте рекомендации для быстрого старта.
          </p>
        </div>
        <div className="page-header__actions">
          <Link className="btn btn--ghost" to="/profile">
            Мой профиль
          </Link>
          <Link className="btn btn--secondary" to="/courses">
            Каталог курсов
          </Link>
        </div>
      </header>

      {profile && (
        <section className="card profile-card">
          <div>
            <p className="eyebrow">Ваш профиль</p>
            <h2>{profileName}</h2>
            <p className="muted">Логин: {profile.username}</p>
          </div>
          <div className="profile-grid">
            <div>
              <span className="muted caption">Отдел / роль</span>
              <p>{profile.profile?.department || 'Не указано'}</p>
            </div>
            <div>
              <span className="muted caption">Наставник</span>
              <p>{profile.profile?.mentor_name || 'Не назначен'}</p>
            </div>
            <div>
              <span className="muted caption">Город</span>
              <p>{profile.profile?.city || 'Не указан'}</p>
            </div>
            <div>
              <span className="muted caption">Дата выхода в компанию</span>
              <p>{formatDate(profile.profile?.date_joined_company)}</p>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Ваши курсы</p>
            <h2>Прогресс обучения</h2>
          </div>
          <Link to="/profile" className="link">
            Настроить профиль
          </Link>
        </div>
        {progresses.length === 0 ? (
          <p>
            Вы ещё не начали занятия. <Link to="/courses">Выберите первый курс</Link>.
          </p>
        ) : (
          <div className="list list--gap">
            {progresses.map((p) => (
              <div key={p.id} className="card card--inline">
                <div>
                  <h3>{p.course.title}</h3>
                  <p className="muted">{p.course.description?.slice(0, 90)}</p>
                  <ProgressBar progress={p.progress} />
                  <p className="muted">{p.progress.toFixed(0)}% завершено</p>
                </div>
                <Link className="btn btn--secondary" to={`/courses/${p.course.id}`}>
                  Продолжить
                </Link>
              </div>
            ))}
          </div>
        )}
        {isStaff && (
          <div className="info-banner">
            <p>
              У вас есть права администратора. Перейдите в{' '}
              <Link to="/admin">панель наставника</Link>, чтобы посмотреть прогресс команды.
            </p>
          </div>
        )}
      </section>

      <div className="dashboard-grid" id="tasks">
        <section className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Пошаговый план</p>
              <h2>Интеграционные задачи</h2>
            </div>
            <span className="tag">{tasksData.progress.toFixed(0)}%</span>
          </div>
          {tasksData.tasks.length === 0 ? (
            <p>Задачи онбординга пока не назначены.</p>
          ) : (
            <>
              <ProgressBar progress={tasksData.progress} />
              <ul className="list list--tasks">
                {tasksData.tasks.map((t) => (
                  <li key={t.task_id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={async () => {
                          try {
                            await api.post(`/courses/integration/tasks/${t.task_id}/toggle/`);
                            const resp = await api.get('/courses/integration/tasks/');
                            setTasksData(resp.data);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      />
                      <span>{t.description}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Фокус дня</p>
              <h2>Лента активности</h2>
            </div>
          </div>
          {activities.length === 0 ? (
            <p>Как только отметите урок, здесь появится запись.</p>
          ) : (
            <ul className="timeline">
              {activities.map((act) => (
                <li key={act.id}>
                  <span>
                    {new Date(act.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <p>{act.action}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Мотиваторы</p>
              <h2>Достижения</h2>
            </div>
          </div>
          {achievements.length === 0 ? (
            <p>Получайте бейджи, завершая уроки и курсы.</p>
          ) : (
            <ul className="list">
              {achievements.map((ach) => (
                <li key={ach.id} className="achievement">
                  <span className={`badge ${ach.awarded ? 'badge--success' : ''}`}>
                    {ach.awarded ? 'Получено' : 'В процессе'}
                  </span>
                  <div>
                    <h4>{ach.name}</h4>
                    <p className="muted">{ach.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Что дальше?</p>
              <h2>Рекомендации</h2>
            </div>
          </div>
          {recommended.length === 0 ? (
            <p>Как только вы завершите текущий курс, мы предложим новые темы.</p>
          ) : (
            <ul className="list list--gap">
              {recommended.map((course) => (
                <li key={course.id} className="card card--inline">
                  <div>
                    <h3>{course.title}</h3>
                    <p className="muted">{course.description}</p>
                    <span className="tag tag--ghost">{course.role}</span>
                  </div>
                  <Link className="btn btn--secondary" to={`/courses/${course.id}`}>
                    Открыть
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
