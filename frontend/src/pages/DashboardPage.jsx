import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import ProgressBar from '../components/ProgressBar';
import { ThemeContext } from '../ThemeContext';

export default function DashboardPage() {
  const [progresses, setProgresses] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [tasksData, setTasksData] = useState({ progress: 0, tasks: [] });
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const resp = await api.get('/courses/progress/');
        setProgresses(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    async function fetchProfile() {
      try {
        const resp = await api.get('/accounts/profile/');
        setIsStaff(resp.data.is_staff);
      } catch (err) {
        // ignore
      }
    }
    async function fetchTasks() {
      try {
        const resp = await api.get('/courses/integration/tasks/');
        setTasksData(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    async function fetchActivities() {
      try {
        const resp = await api.get('/courses/activities/');
        setActivities(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    async function fetchAchievements() {
      try {
        const resp = await api.get('/courses/achievements/');
        setAchievements(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    async function fetchRecommended() {
      try {
        const resp = await api.get('/courses/recommended/');
        setRecommended(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProgress();
    fetchProfile();
    fetchTasks();
    fetchActivities();
    fetchAchievements();
    fetchRecommended();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>Dashboard</h2>
      <button onClick={handleLogout} style={{ marginBottom: '1rem' }}>Logout</button>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={toggleTheme} style={{ marginRight: '1rem' }}>
          Switch to {theme === 'light' ? 'dark' : 'light'} mode
        </button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/profile">Edit Profile</Link>
        {isStaff && (
          <>
            {' | '}
            <Link to="/admin">Admin Dashboard</Link>
          </>
        )}
      </div>
      <h3>Your Course Progress</h3>
      {progresses.length === 0 ? (
        <p>You have not started any courses yet. <Link to="/courses">Browse courses</Link>.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {progresses.map((p) => (
            <div key={p.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
              <h4>{p.course.title}</h4>
              <ProgressBar progress={p.progress} />
              <p>{p.progress.toFixed(0)}% completed</p>
              <Link to={`/courses/${p.course.id}`}>Continue course</Link>
            </div>
          ))}
          <Link to="/courses">Browse all courses</Link>
        </div>
      )}

      {/* Integration plan tasks */}
      <h3 style={{ marginTop: '2rem' }}>Your Integration Plan</h3>
      {tasksData.tasks.length === 0 ? (
        <p>No integration tasks defined.</p>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <ProgressBar progress={tasksData.progress} />
          <p>{tasksData.progress.toFixed(0)}% of tasks completed</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasksData.tasks.map((t) => (
              <li key={t.task_id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={async () => {
                    try {
                      await api.post(`/courses/integration/tasks/${t.task_id}/toggle/`);
                      // Refresh tasks
                      const resp = await api.get('/courses/integration/tasks/');
                      setTasksData(resp.data);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={{ marginRight: '0.5rem' }}
                />
                {t.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Activity log */}
      <h3>Recent Activity</h3>
      {activities.length === 0 ? (
        <p>No recent activity.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {activities.map((act) => (
            <li key={act.id} style={{ marginBottom: '0.5rem' }}>
              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {act.action}
            </li>
          ))}
        </ul>
      )}

      {/* Achievements */}
      <h3>Your Achievements</h3>
      {achievements.length === 0 ? (
        <p>You have no achievements yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {achievements.map((ach) => (
            <li key={ach.id} style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: ach.awarded ? 'bold' : 'normal' }}>
                {ach.name}
              </span>{' '}
              {ach.awarded ? '✓' : ''}
            </li>
          ))}
        </ul>
      )}

      {/* Recommended courses */}
      <h3>Recommended Courses</h3>
      {recommended.length === 0 ? (
        <p>No recommendations at this time.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {recommended.map((course) => (
            <li key={course.id} style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)', margin: '1rem 0', padding: '1rem', borderRadius: '4px' }}>
              <h4>{course.title}</h4>
              <p>{course.description}</p>
              <p><strong>Role:</strong> {course.role}</p>
              <Link to={`/courses/${course.id}`}>View Course</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}