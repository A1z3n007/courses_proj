import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

/**
 * QuizPage renders a quiz associated with a particular course. Users can
 * select an answer for each question and submit their responses. After
 * submission, the score is displayed along with the total number of
 * questions. This page assumes that the user is authenticated.
 */
export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const resp = await api.get(`/courses/${id}/quiz/`);
        setQuiz(resp.data);
      } catch (err) {
        setError('Unable to load quiz.');
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
      // POST answers mapping questionId -> answerId
      const resp = await api.post(`/courses/${id}/quiz/submit/`, { answers });
      setResult(resp.data);
    } catch (err) {
      setError('Failed to submit quiz.');
    }
  };

  if (!quiz) {
    return <p>{error || 'Loading quiz...'}</p>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>Quiz: {quiz.title}</h2>
      <Link to={`/courses/${id}`}>Back to Course</Link>
      {result ? (
        <div style={{ marginTop: '1rem' }}>
          <p>You scored {result.score} out of {result.total}.</p>
          <button onClick={() => navigate(`/courses/${id}`)} style={{ marginTop: '0.5rem' }}>
            Return to Course
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          {quiz.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: '1rem', border: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: '1rem', borderRadius: '4px' }}>
              <p style={{ fontWeight: 'bold' }}>{q.text}</p>
              {q.answers.map((ans) => (
                <div key={ans.id} style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={ans.id}
                      checked={answers[q.id] === ans.id}
                      onChange={() => handleAnswerChange(q.id, ans.id)}
                    />
                    {' '}{ans.text}
                  </label>
                </div>
              ))}
            </div>
          ))}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>Submit Quiz</button>
        </form>
      )}
    </div>
  );
}