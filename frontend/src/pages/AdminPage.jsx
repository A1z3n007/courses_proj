import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AdminPage() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const resp = await api.get('/courses/admin/progress/');
        setRecords(resp.data);
      } catch (err) {
        setError('У вас нет прав для просмотра админ-панели.');
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Панель наставника</p>
            <h1>Доступ ограничен</h1>
            <p className="muted">{error}</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Панель наставника</p>
          <h1>Прогресс команды</h1>
          <p className="muted">
            Просматривайте, сколько уроков прошли сотрудники, чтобы вовремя помогать им в обучении.
          </p>
        </div>
      </header>
      <section className="card">
        {records.length === 0 ? (
          <p>Записей пока нет.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Курс</th>
                  <th>Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.user}</td>
                    <td>{record.course.title}</td>
                    <td>{record.progress.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
