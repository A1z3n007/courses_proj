import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [progresses, setProgresses] = useState([]);

  // Fetch courses when filters change
  useEffect(() => {
    async function fetchCourses() {
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedRole !== 'all') params.role = selectedRole;
        const resp = await api.get('/courses/', { params });
        setCourses(resp.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCourses();
  }, [searchTerm, selectedRole]);

  // Fetch progress once when the component mounts
  useEffect(() => {
    async function fetchProgress() {
      try {
        const resp = await api.get('/courses/progress/');
        setProgresses(resp.data);
      } catch (err) {
        // ignore if not logged in or error
      }
    }
    fetchProgress();
  }, []);

  // Determine status for each course based on progress data
  const getStatus = (courseId) => {
    const record = progresses.find((p) => p.course.id === courseId);
    if (!record) return 'not_started';
    if (record.progress >= 100) return 'completed';
    return 'in_progress';
  };

  // Filter courses based on selectedStatus
  const filteredCourses = courses.filter((course) => {
    if (selectedStatus === 'all') return true;
    return getStatus(course.id) === selectedStatus;
  });

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>Available Courses</h2>
      <Link to="/">Back to Dashboard</Link>
      {/* Filters */}
      <div style={{ margin: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 200px', padding: '0.5rem' }}
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="all">All Roles</option>
          <option value="welder">Welder</option>
          <option value="manager">Manager</option>
          <option value="seller">Seller</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredCourses.map((course) => (
          <li key={course.id} style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)', margin: '1rem 0', padding: '1rem', borderRadius: '4px' }}>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p><strong>Role:</strong> {course.role}</p>
            <p><strong>Status:</strong> {getStatus(course.id).replace('_', ' ')}</p>
            <Link to={`/courses/${course.id}`}>View Course</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}