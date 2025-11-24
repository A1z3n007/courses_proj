import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

const roles = [
  { value: 'welder', label: 'Сварщик' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'seller', label: 'Продавец' },
];

const createLesson = (order) => ({
  title: '',
  content: '',
  video_url: '',
  image_url: '',
  module_title: '',
  estimated_minutes: 15,
  order,
});

export default function CourseBuilderPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    role: 'welder',
    image_url: '',
  });
  const [lessons, setLessons] = useState([createLesson(1)]);
  const [message, setMessage] = useState({ error: '', success: '' });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    api
      .get('/accounts/profile/')
      .then((resp) => {
        if (isMounted) {
          setProfile(resp.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage({
            error:
              'Не удалось проверить права администратора. Обновите страницу или перезайдите в систему.',
            success: '',
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateLesson = (index, field, value) => {
    setLessons((prev) =>
      prev.map((lesson, idx) => (idx === index ? { ...lesson, [field]: value } : lesson)),
    );
  };

  const addLesson = () => {
    setLessons((prev) => [...prev, createLesson(prev.length + 1)]);
  };

  const removeLesson = (index) => {
    setLessons((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ error: '', success: '' });
    try {
      await api.post('/courses/manage/', {
        ...courseData,
        lessons: lessons.filter((lesson) => lesson.title.trim().length),
      });
      setMessage({
        error: '',
        success: 'Курс опубликован! Посмотрите карточку в каталоге и назначьте его коллегам.',
      });
      setCourseData({ title: '', description: '', role: 'welder', image_url: '' });
      setLessons([createLesson(1)]);
      navigate('/courses');
    } catch (err) {
      setMessage({
        error: 'Не удалось сохранить курс. Проверьте заполнение формы и попробуйте снова.',
        success: '',
      });
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Loader label="Проверяем права администратора..." />
      </div>
    );
  }

  if (!profile?.is_staff) {
    return (
      <div className="page">
        <div className="card">
          <p>Создание курсов доступно только наставникам и администраторам.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Конструктор контента</p>
          <h1>Создание нового курса</h1>
          <p className="muted">
            Добавьте общие сведения, разбейте программу по модулям и прикрепите видео/презентации —
            так курс сразу готов к запуску.
          </p>
        </div>
      </header>
      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Название курса</span>
            <input
              className="input"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              required
            />
          </label>
          <label className="form-field">
            <span>Описание</span>
            <textarea
              className="input"
              style={{ minHeight: '120px' }}
              value={courseData.description}
              onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Роль</span>
            <select
              className="select"
              value={courseData.role}
              onChange={(e) => setCourseData({ ...courseData, role: e.target.value })}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Обложка курса (URL)</span>
            <input
              className="input"
              value={courseData.image_url}
              onChange={(e) => setCourseData({ ...courseData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </label>

          <div className="lesson-builder">
            <div className="card__header">
              <div>
                <p className="eyebrow">Структура</p>
                <h2>Программа и уроки</h2>
              </div>
              <button type="button" className="btn btn--secondary" onClick={addLesson}>
                Добавить урок
              </button>
            </div>
            {lessons.map((lesson, index) => (
              <div key={index} className="lesson card card--inline" style={{ flexDirection: 'column' }}>
                <div className="lesson-actions">
                  <h3>Урок {index + 1}</h3>
                  {lessons.length > 1 && (
                    <button type="button" className="btn btn--ghost" onClick={() => removeLesson(index)}>
                      Удалить
                    </button>
                  )}
                </div>
                <label className="form-field">
                  <span>Название урока</span>
                  <input
                    className="input"
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, 'title', e.target.value)}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Модуль / спринт</span>
                  <input
                    className="input"
                    value={lesson.module_title}
                    onChange={(e) => updateLesson(index, 'module_title', e.target.value)}
                    placeholder="Введение, Практика, Блок тестов..."
                  />
                </label>
                <label className="form-field">
                  <span>Планируемое время (минут)</span>
                  <input
                    className="input"
                    type="number"
                    min="5"
                    value={lesson.estimated_minutes}
                    onChange={(e) => updateLesson(index, 'estimated_minutes', Number(e.target.value))}
                  />
                </label>
                <label className="form-field">
                  <span>Краткое содержание / текст</span>
                  <textarea
                    className="input"
                    style={{ minHeight: '100px' }}
                    value={lesson.content}
                    onChange={(e) => updateLesson(index, 'content', e.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>Видео (mp4 или ссылка на YouTube)</span>
                  <input
                    className="input"
                    value={lesson.video_url}
                    onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label className="form-field">
                  <span>Изображение / превью урока</span>
                  <input
                    className="input"
                    value={lesson.image_url}
                    onChange={(e) => updateLesson(index, 'image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>
            ))}
          </div>
          {message.error && <p className="form-error">{message.error}</p>}
          {message.success && <p className="form-success">{message.success}</p>}
          <button type="submit" className="btn">
            Сохранить курс
          </button>
        </form>
      </section>
    </div>
  );
}
