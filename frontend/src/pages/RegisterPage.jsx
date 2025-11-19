import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/accounts/register/', {
        username,
        email,
        password,
      });
      navigate('/login');
    } catch (err) {
      setError('Не удалось создать аккаунт. Попробуйте другое имя пользователя.');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <p className="auth-card__eyebrow">Три шага до старта</p>
        <h1>Регистрация</h1>
        <p className="auth-card__hint">
          Создайте профиль, чтобы выбрать курс интеграции и отслеживать прогресс.
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
              placeholder="Например, ivan.petrov"
              required
            />
          </label>
          <label className="form-field">
            <span>Рабочая почта</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </label>
          <label className="form-field">
            <span>Пароль</span>
            <div className="input-toggle">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Не менее 8 символов"
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
            Создать аккаунт
          </button>
        </form>
        <p className="auth-card__hint">
          Уже зарегистрированы? <Link to="/login">Войдите</Link>
        </p>
      </div>
    </div>
  );
}
