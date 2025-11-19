import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      });
      const { access, refresh } = response.data;
      login(access, refresh);
      navigate('/');
    } catch (err) {
      setError('Неверный логин или пароль.');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <p className="auth-card__eyebrow">Добро пожаловать!</p>
        <h1>Вход в платформу</h1>
        <p className="auth-card__hint">
          Учитесь, отслеживайте прогресс и проходите адаптацию в одном месте.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Имя пользователя</span>
            <input
              className="input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
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
                placeholder="Введите пароль"
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
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn">
            Войти
          </button>
        </form>
        <p className="auth-card__hint">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>
    </div>
  );
}
