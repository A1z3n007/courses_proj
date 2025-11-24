import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext.jsx';

const moodClasses = ['idle', 'email', 'password', 'error', 'success', 'cta', 'typing'];

function Character({ type, pupilOffset, mouthVariant, eyes = 2 }) {
  return (
    <div className={`login-shape login-shape--${type}`}>
      <div className="login-face">
        <div className="login-eyes">
          {Array.from({ length: eyes }).map((_, idx) => (
            <span key={idx} className="login-eye">
              <span
                className="login-pupil"
                style={{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }}
              />
            </span>
          ))}
        </div>
        <span className={`login-mouth login-mouth--${mouthVariant}`} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mood, setMood] = useState('idle');
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = Math.max(-8, Math.min(8, (e.clientX - cx) / 40));
      const dy = Math.max(-8, Math.min(8, (e.clientY - cy) / 40));
      setPupilOffset({ x: dx, y: dy });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMood('typing');
    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      });
      const { access, refresh } = response.data;
      login(access, refresh);
      setMood('success');
      navigate('/');
    } catch (err) {
      setError('Неверный логин или пароль.');
      setMood('error');
    }
  };

  const onFocusEmail = () => setMood('email');
  const onFocusPassword = () => setMood('password');
  const mouthVariant = mood === 'error' ? 'sad' : mood === 'success' ? 'smile' : 'neutral';

  return (
    <div className="login-hero">
      <div className="login-card">
        <div
          className={`login-illustration ${
            moodClasses.includes(mood) ? `login-illustration--${mood}` : 'login-illustration--idle'
          }`}
        >
          <div className="login-characters">
            <Character type="purple" pupilOffset={pupilOffset} mouthVariant={mouthVariant} />
            <Character type="black" pupilOffset={pupilOffset} mouthVariant={mouthVariant} />
            <Character type="yellow" pupilOffset={pupilOffset} mouthVariant={mouthVariant} eyes={1} />
            <Character type="orange" pupilOffset={pupilOffset} mouthVariant={mouthVariant} />
          </div>
        </div>

        <div className="login-form">
          <div className="login-form__badge">✣</div>
          <h1>С возвращением!</h1>
          <p className="muted">Введите логин и пароль, чтобы продолжить обучение и видеть прогресс.</p>

          <form className="form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Имя пользователя или e-mail</span>
              <input
                className="input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={onFocusEmail}
                onBlur={() => setMood('idle')}
                placeholder="ivan.petrov@example.com"
                required
              />
            </label>
            <label className="form-field">
              <span>Пароль</span>
              <div className="input-toggle">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={onFocusPassword}
                  onBlur={() => setMood('idle')}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="input-toggle__btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </label>

            <div className="login-remember">
              <label className="checkbox">
                <input type="checkbox" />
                <span>Запомнить на 30 дней</span>
              </label>
              <a className="muted" href="#">
                Забыли пароль?
              </a>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn btn--primary">
              Войти
            </button>

            <button type="button" className="btn btn--google" onClick={() => setMood('cta')}>
              <span>Войти через Google</span>
            </button>
          </form>

          <p className="auth-card__hint">
            Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
