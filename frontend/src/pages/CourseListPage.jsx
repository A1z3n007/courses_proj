import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

const statusMap = {
  not_started: 'Не начат',
  in_progress: 'В процессе',
  completed: 'Пройден',
};

const roleLabels = {
  welder: 'Сварщик',
  manager: 'Менеджер',
  seller: 'Продавец',
};

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [progresses, setProgresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedRole !== 'all') params.role = selectedRole;
        const resp = await api.get('/courses/', { params });
        setCourses(resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [searchTerm, selectedRole]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const resp = await api.get('/courses/progress/');
        setProgresses(resp.data);
      } catch {
        /* ignore */
      }
    }
    fetchProgress();
  }, []);

  const getStatus = (courseId) => {
    const record = progresses.find((p) => p.course.id === courseId);
    if (!record) return 'not_started';
    if (record.progress >= 100) return 'completed';
    return 'in_progress';
  };

  const filteredCourses = courses.filter((course) => {
    if (selectedStatus === 'all') return true;
    return getStatus(course.id) === selectedStatus;
  });

  const renderMedia = (course) => {
    if (!course.image_url) {
      return (
        <div className="course-card__placeholder">
          <span role="img" aria-label="course">
            🎓
          </span>
        </div>
      );
    }
    return <img src={course.image_url} alt={course.title} />;
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Каталог</p>
          <h1>Курсы для интеграции</h1>
          <p className="muted">
            Подберите программу под свою роль, чтобы быстрее завершить онбординг.
          </p>
        </div>
        <Link to="/" className="btn btn--ghost">
          На главную
        </Link>
      </header>
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
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">Все роли</option>
            <option value="welder">Сварщик</option>
            <option value="manager">Менеджер</option>
            <option value="seller">Продавец</option>
          </select>
          <select
            className="select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="not_started">Не начаты</option>
            <option value="in_progress">В процессе</option>
            <option value="completed">Завершены</option>
          </select>
        </div>
        {loading ? (
          <Loader label="Подбираем курсы..." />
        ) : filteredCourses.length === 0 ? (
          <p>По выбранным условиям курсов не найдено.</p>
        ) : (
          <div className="list list--gap">
            {filteredCourses.map((course) => (
              <div key={course.id} className="card course-card">
                <div className="course-card__media">{renderMedia(course)}</div>
                <div className="course-card__body">
                  <h3>{course.title}</h3>
                  <p className="muted">{course.description}</p>
                  <div className="chip-row">
                    <span className="tag tag--ghost">{roleLabels[course.role] || course.role}</span>
                    <span className="tag">{statusMap[getStatus(course.id)]}</span>
                  </div>
                </div>
                <div className="course-card__actions">
                  <Link className="btn btn--secondary" to={`/courses/${course.id}`}>
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
