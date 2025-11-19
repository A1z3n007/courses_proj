import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext.jsx';

const navLinks = [
  { to: '/', label: 'Главная' },
  { to: '/courses', label: 'Курсы' },
  { to: '/profile', label: 'Профиль' },
  { to: '/admin', label: 'Админ-панель' },
];

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarUser, setSidebarUser] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/accounts/profile/')
      .then((resp) => {
        if (active) {
          setSidebarUser(resp.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (() => {
    if (!sidebarUser) {
      return 'IH';
    }
    const first = (sidebarUser.first_name || sidebarUser.username || 'I')
      .trim()
      .charAt(0)
      .toUpperCase();
    const last = (sidebarUser.last_name || 'H').trim().charAt(0).toUpperCase();
    return `${first}${last}`;
  })();

  const sidebarName = sidebarUser
    ? [sidebarUser.first_name, sidebarUser.last_name].filter(Boolean).join(' ').trim() ||
      sidebarUser.username
    : 'Integration Hub';

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__logo">
          <span className="app-shell__logo-mark">{initials}</span>
          <div>
            <strong>Integration Hub</strong>
            <p>Обучение сотрудников</p>
          </div>
        </div>
        <nav className="app-shell__nav">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`app-shell__nav-link ${isActive ? 'app-shell__nav-link--active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {sidebarUser && (
          <div className="app-shell__user-card">
            <p className="app-shell__user-name">{sidebarName}</p>
            <p className="app-shell__user-role">
              {sidebarUser.profile?.department || 'Роль не указана'}
            </p>
          </div>
        )}
        <div className="app-shell__footer">
          <p>Готовы продолжать обучение?</p>
          <button className="btn btn--ghost" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="app-shell__content">
        <div className="app-shell__gradient" aria-hidden="true" />
        {children}
      </main>
    </div>
  );
}
