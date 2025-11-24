import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';

const toYouTubeEmbed = (url) => {
  if (!url) return null;
  const match = url.match(/(?:v=|\.be\/)([A-Za-z0-9_-]+)/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [averageRating, setAverageRating] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [showQuizLink, setShowQuizLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProgress = async (hasQuizOverride) => {
    try {
      const progressResp = await api.get('/courses/progress/');
      const list = Array.isArray(progressResp.data)
        ? progressResp.data
        : Array.isArray(progressResp.data?.results)
        ? progressResp.data.results
        : [];
      const progressData = list.find((p) => p?.course?.id === Number(id));
      if (progressData) {
        const completed = Array.isArray(progressData.completed_lessons)
          ? progressData.completed_lessons
          : [];
        setCompletedLessons(completed);
        const progressValue =
          typeof progressData.progress === 'number'
            ? progressData.progress
            : Number(progressData.progress) || 0;
        setProgress(progressValue);
        const hasQuiz =
          typeof hasQuizOverride === 'boolean'
            ? hasQuizOverride
            : Boolean(course?.has_quiz);
        setShowQuizLink(hasQuiz && progressValue >= 100);
      } else {
        setCompletedLessons([]);
        setProgress(0);
        setShowQuizLink(false);
      }
    } catch (err) {
      console.error('Failed to refresh progress', err);
    }
  };

  useEffect(() => {
    let active = true;
    async function fetchCourse() {
      setLoading(true);
      try {
        const courseResp = await api.get(`/courses/${id}/`);
        if (!active) return;
        const data = courseResp.data || null;
        setCourse(data);
        const avg =
          typeof data?.average_rating === 'number' ? data.average_rating : null;
        setAverageRating(avg);
        await refreshProgress(data?.has_quiz);
      } catch (err) {
        console.error('Failed to load course', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchCourse();
    return () => {
      active = false;
    };
  }, [id]);

  const handleToggleLesson = async (lessonId, isCompleted) => {
    try {
      if (isCompleted) {
        await api.post(`/courses/${id}/lessons/${lessonId}/uncomplete/`);
      } else {
        await api.post(`/courses/${id}/lessons/${lessonId}/complete/`);
      }
      await refreshProgress();
    } catch (err) {
      console.error('Failed to toggle lesson', err);
    }
  };

  const renderVideo = (url) => {
    if (!url) return null;
    const embed = toYouTubeEmbed(url);
    if (embed) {
      return (
        <div className="video-wrapper">
          <iframe
            src={embed}
            title="Видео урок"
            width="100%"
            height="360"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <div className="video-wrapper">
        <video src={url} controls width="100%" />
      </div>
    );
  };

  if (loading || !course) {
    return (
      <div className="page">
        <Loader label="Загружаем курс..." />
      </div>
    );
  }

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Курс</p>
          <h1>{course.title}</h1>
          <p className="muted">{course.description}</p>
        </div>
        <Link className="btn btn--ghost" to="/courses">
          Назад
        </Link>
      </header>

      <section className="card course-hero">
        <div className="course-hero__image">
          {course.image_url ? (
            <img src={course.image_url} alt={course.title} />
          ) : (
            <div className="course-card__placeholder">
              <span role="img" aria-label="course hero">
                🎯
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">О курсе</p>
          <h2>{course.title}</h2>
          <p className="muted">{course.description}</p>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Движение по урокам</p>
            <h2>Прогресс</h2>
          </div>
          <span className="tag">{progress.toFixed(0)}%</span>
        </div>
        <ProgressBar progress={progress} />
        {showQuizLink && (
          <div className="info-banner">
            <p>
              Поздравляем! Курс завершён — можно пройти{' '}
              <Link to={`/courses/${id}/quiz`}>итоговый тест</Link>.
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Обратная связь</p>
            <h2>Оценка курса</h2>
          </div>
          {averageRating !== null && (
            <span className="tag">
              {Number(averageRating).toFixed(2)} / 5
            </span>
          )}
        </div>
        {averageRating === null && <p>Этот курс ещё никто не оценивал.</p>}
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setReviewError('');
            setReviewSuccess('');
            try {
              await api.post(`/courses/${id}/reviews/`, {
                rating: Number(rating),
                comment,
              });
              setReviewSuccess('Спасибо! Отзыв отправлен.');
              setComment('');
              const resp = await api.get(`/courses/${id}/`);
              const newAvg =
                typeof resp.data?.average_rating === 'number'
                  ? resp.data.average_rating
                  : null;
              setAverageRating(newAvg);
            } catch (err) {
              console.error('Failed to send review', err);
              setReviewError(
                'Не удалось отправить отзыв. Возможно, вы уже оставляли оценку.',
              );
            }
          }}
        >
          <label className="form-field">
            <span>Ваша оценка</span>
            <select
              className="select"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Комментарий</span>
            <textarea
              className="input"
              style={{ minHeight: '120px' }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Что понравилось? Что улучшить?"
            />
          </label>
          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          <button type="submit" className="btn btn--secondary">
            Отправить отзыв
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Материалы</p>
            <h2>Список уроков</h2>
          </div>
        </div>
        <ul className="list list--gap">
          {lessons.map((lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);
            return (
              <li
                key={lesson.id}
                className={`lesson ${isCompleted ? 'lesson--done' : ''}`}
              >
                <div>
                  <h3>{lesson.title}</h3>
                  <p className="muted">{lesson.content}</p>
                  {lesson.image_url && (
                    <div className="lesson-image">
                      <img src={lesson.image_url} alt={lesson.title} />
                    </div>
                  )}
                  {lesson.video_url && renderVideo(lesson.video_url)}
                </div>
                <button
                  className="btn"
                  onClick={() => handleToggleLesson(lesson.id, isCompleted)}
                >
                  {isCompleted ? 'Вернуть в план' : 'Отметить как пройдено'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
