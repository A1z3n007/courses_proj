import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

/**
 * AdminPage displays a table of all users and their course progress.
 * Only users with admin privileges can access this endpoint. Non‑admins will
 * see an unauthorized message.
 */
export default function AdminPage() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const resp = await api.get('/courses/admin/progress/');
        setRecords(resp.data);
      } catch (err) {
        setError('You are not authorized to view this page.');
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2>Admin Dashboard</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <Link to="/">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>Admin Dashboard</h2>
      <Link to="/">Back to Dashboard</Link>
      {records.length === 0 ? (
        <p>No progress records found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>User</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Course</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Progress (%)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{record.user}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{record.course.title}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{record.progress.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}