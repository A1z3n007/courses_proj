import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import ProgressBar from '../components/ProgressBar';

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

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseResp, progressResp] = await Promise.all([
          api.get(`/courses/${id}/`),
          api.get('/courses/progress/'),
        ]);
        setCourse(courseResp.data);
        setAverageRating(courseResp.data.average_rating);
        // Find progress for this course
        const progressData = progressResp.data.find((p) => p.course.id === parseInt(id));
        if (progressData) {
          setCompletedLessons(progressData.completed_lessons);
          setProgress(progressData.progress);
        } else {
          setCompletedLessons([]);
          setProgress(0);
        }
        // Determine if quiz link should be shown: course has quiz and progress 100%
        if (courseResp.data.has_quiz && progressData && progressData.progress >= 100) {
          setShowQuizLink(true);
        } else {
          setShowQuizLink(false);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id]);

  const handleToggleLesson = async (lessonId, isCompleted) => {
    try {
      if (isCompleted) {
        await api.post(`/courses/${id}/lessons/${lessonId}/uncomplete/`);
        setCompletedLessons((prev) => prev.filter((lid) => lid !== lessonId));
      } else {
        await api.post(`/courses/${id}/lessons/${lessonId}/complete/`);
        setCompletedLessons((prev) => [...prev, lessonId]);
      }
      // Update progress after toggling
      if (course) {
        const total = course.lessons.length;
        const newCompleted = isCompleted
          ? completedLessons.filter((lid) => lid !== lessonId).length
          : completedLessons.length + 1;
        setProgress((newCompleted / total) * 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!course) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <Link to="/courses">Back to Courses</Link>
      <div style={{ margin: '1rem 0' }}>
        <ProgressBar progress={progress} />
        <p>{progress.toFixed(0)}% completed</p>
        {/* Show quiz link if course has quiz and progress is complete */}
        {showQuizLink && (
          <div style={{ marginTop: '0.5rem' }}>
            <Link to={`/courses/${id}/quiz`}>Take Quiz</Link>
          </div>
        )}
      </div>

      {/* Rating information */}
      <div style={{ marginBottom: '1rem' }}>
        <h3>Course Rating</h3>
        {averageRating !== null ? (
          <p>Average rating: {averageRating.toFixed(2)} / 5</p>
        ) : (
          <p>No ratings yet.</p>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setReviewError('');
            setReviewSuccess('');
            try {
              await api.post(`/courses/${id}/reviews/`, {
                rating: Number(rating),
                comment,
              });
              setReviewSuccess('Thank you for your review!');
              setComment('');
              // Reload course details to update average rating
              const resp = await api.get(`/courses/${id}/`);
              setAverageRating(resp.data.average_rating);
            } catch (err) {
              setReviewError('Unable to submit review. You may have already reviewed this course.');
            }
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Your rating:</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ marginLeft: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Your comment:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%', minHeight: '80px' }}
            />
          </div>
          {reviewError && <p style={{ color: 'red' }}>{reviewError}</p>}
          {reviewSuccess && <p style={{ color: 'green' }}>{reviewSuccess}</p>}
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>Submit Review</button>
        </form>
      </div>
      <h3>Lessons</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {course.lessons.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <li key={lesson.id} style={{ border: '1px solid #ccc', margin: '1rem 0', padding: '1rem', borderRadius: '4px' }}>
              <h4>{lesson.title}</h4>
              {lesson.video_url && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <video src={lesson.video_url} controls width="100%" />
                </div>
              )}
              <p>{lesson.content}</p>
              <button onClick={() => handleToggleLesson(lesson.id, isCompleted)}>
                {isCompleted ? 'Mark as uncompleted' : 'Mark as completed'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}