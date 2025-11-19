import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import QuizPage from './pages/QuizPage';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={token ? <DashboardPage /> : <Navigate to="/login" replace />} />
      <Route
        path="/courses"
        element={token ? <CourseListPage /> : <Navigate to="/login" replace />} />
      <Route
        path="/courses/:id"
        element={token ? <CourseDetailPage /> : <Navigate to="/login" replace />} />
      <Route
        path="/courses/:id/quiz"
        element={token ? <QuizPage /> : <Navigate to="/login" replace />} />
      <Route
        path="/profile"
        element={token ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route
        path="/admin"
        element={token ? <AdminPage /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;