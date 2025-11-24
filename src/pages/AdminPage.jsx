import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AdminPage() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const resp = await api.get('/courses/admin/progress/');
        const data = Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp.data?.results)
          ? resp.data.results
          : [];
        setRecords(data);
      } catch (err) {
        console.error('Failed to load admin progress', err);
        setError('Не удалось загрузить данные из панели наставника.');
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
            <h1>Нет доступа</h1>
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
          <h1>Прогресс сотрудников</h1>
          <p className="muted">
            Следите, кто завершает адаптацию и кому нужна помощь по материалам.
          </p>
        </div>
      </header>
      <section className="card">
        {records.length === 0 ? (
          <p>Данные ещё не появились.</p>
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
                {records.map((record) => {
                  const progressValue =
                    typeof record.progress === 'number'
                      ? record.progress
                      : Number(record.progress) || 0;
                  return (
                    <tr key={record.id}>
                      <td>{record.user}</td>
                      <td>{record.course?.title}</td>
                      <td>{progressValue.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
