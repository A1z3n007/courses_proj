import React, { useEffect, useState } from 'react';
import api from '../api';
import Loader from '../components/Loader';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      department: '',
      mentor_name: '',
      date_joined_company: '',
      city: '',
      avatar: '',
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const resp = await api.get('/accounts/profile/');
        const profileData = resp.data.profile || {
          department: '',
          mentor_name: '',
          date_joined_company: '',
          city: '',
          avatar: '',
        };
        setData({
          first_name: resp.data.first_name || '',
          last_name: resp.data.last_name || '',
          email: resp.data.email || '',
          profile: profileData,
        });
      } catch (err) {
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, [field]: value },
      }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put('/accounts/profile/', data);
      setSuccess('Профиль обновлён');
    } catch (err) {
      setError('Не удалось сохранить профиль');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Loader label="Загружаем профиль..." />
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Профиль</p>
          <h1>Личные данные</h1>
          <p className="muted">Обновите контакты и информацию для наставника.</p>
        </div>
      </header>
      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Имя</span>
            <input
              className="input"
              type="text"
              name="first_name"
              value={data.first_name}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Фамилия</span>
            <input
              className="input"
              type="text"
              name="last_name"
              value={data.last_name}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Рабочая почта</span>
            <input
              className="input"
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Отдел / роль</span>
            <input
              className="input"
              type="text"
              name="profile.department"
              value={data.profile.department}
              onChange={handleChange}
              placeholder="Например, Продажи"
            />
          </label>
          <label className="form-field">
            <span>Наставник</span>
            <input
              className="input"
              type="text"
              name="profile.mentor_name"
              value={data.profile.mentor_name}
              onChange={handleChange}
              placeholder="ФИО наставника"
            />
          </label>
          <label className="form-field">
            <span>Дата выхода в компанию</span>
            <input
              className="input"
              type="date"
              name="profile.date_joined_company"
              value={data.profile.date_joined_company || ''}
              onChange={handleChange}
            />
          </label>
          <label className="form-field">
            <span>Город</span>
            <input
              className="input"
              type="text"
              name="profile.city"
              value={data.profile.city}
              onChange={handleChange}
              placeholder="Алматы, Нур-Султан..."
            />
          </label>
          <label className="form-field">
            <span>Аватар</span>
            <select
              className="select"
              name="profile.avatar"
              value={data.profile.avatar}
              onChange={handleChange}
            >
              <option value="">Выберите вариант</option>
              <option value="robot">Робот</option>
              <option value="astronaut">Астронавт</option>
              <option value="worker">Сотрудник</option>
              <option value="manager">Менеджер</option>
              <option value="seller">Продавец</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button type="submit" className="btn">
            Сохранить
          </button>
        </form>
      </section>
    </div>
  );
}
