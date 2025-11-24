import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      try {
        const resp = await api.get(`/courses/${id}/quiz/`);
        setQuiz(resp.data);
      } catch (err) {
        setError('Не удалось загрузить тест.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  const handleAnswerChange = (questionId, answerId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await api.post(`/courses/${id}/quiz/submit/`, { answers });
      setResult(resp.data);
    } catch (err) {
      setError('Отправка ответов не удалась.');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Loader label="Готовим вопросы..." />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page">
        <p>{error || 'Тест недоступен.'}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Итоговый тест</p>
          <h1>{quiz.title}</h1>
          <p className="muted">Ответьте на вопросы, чтобы закрепить знания из курса.</p>
        </div>
        <Link className="btn btn--ghost" to={`/courses/${id}`}>
          Назад к курсу
        </Link>
      </header>

      <section className="card">
        {result ? (
          <div className="result-banner">
            <h2>
              Ваш результат: {result.score} / {result.total}
            </h2>
            <p className="muted">
              {result.score === result.total
                ? 'Идеально! Вы усвоили материал.'
                : 'Посмотрите вопросы, в которых сомневались, и повторите урок.'}
            </p>
            <button className="btn" onClick={() => navigate(`/courses/${id}`)}>
              Вернуться к урокам
            </button>
          </div>
        ) : (
          <form className="quiz" onSubmit={handleSubmit}>
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="quiz-card">
                <p className="quiz-card__title">
                  {index + 1}. {q.text}
                </p>
                {q.answers.map((ans) => (
                  <label key={ans.id} className="quiz-option">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={ans.id}
                      checked={answers[q.id] === ans.id}
                      onChange={() => handleAnswerChange(q.id, ans.id)}
                      required
                    />
                    <span>{ans.text}</span>
                  </label>
                ))}
              </div>
            ))}
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn">
              Отправить ответы
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
