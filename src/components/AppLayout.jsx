import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext.jsx';

const baseLinks = [
  { to: '/', label: 'Главная' },
  { to: '/courses', label: 'Курсы' },
  { to: '/profile', label: 'Профиль' },
  { to: '/admin', label: 'Админ-панель' },
];

const avatarPresets = {
  robot: { label: 'Робот', emoji: '🤖', color: '#9b8bff' },
  astronaut: { label: 'Астронавт', emoji: '👩‍🚀', color: '#5fa0ff' },
  worker: { label: 'Сотрудник', emoji: '👷‍♂️', color: '#f6b756' },
  manager: { label: 'Менеджер', emoji: '👔', color: '#47b07d' },
  seller: { label: 'Продавец', emoji: '🛒', color: '#ff8f70' },
};

const departmentLabels = {
  welder: 'Сварщик',
  manager: 'Менеджер',
  seller: 'Продавец',
  student: 'Ученик',
};

const getDepartmentLabel = (value) => {
  if (!value) {
    return 'Ученик';
  }
  const normalized = value.toLowerCase();
  return departmentLabels[normalized] || value;
};

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

  const sidebarName = sidebarUser
    ? [sidebarUser.first_name, sidebarUser.last_name].filter(Boolean).join(' ').trim() ||
      sidebarUser.username
    : 'Integration Hub';

  const userRole = useMemo(() => {
    if (!sidebarUser) {
      return 'Онбординг';
    }
    if (sidebarUser.is_staff) {
      return 'Администратор';
    }
    return getDepartmentLabel(sidebarUser.profile?.department);
  }, [sidebarUser]);

  const avatar = useMemo(() => {
    if (!sidebarUser) {
      return { emoji: 'IH', color: '#47b07d' };
    }
    const preset = avatarPresets[sidebarUser.profile?.avatar];
    if (preset) {
      return preset;
    }
    const initials = sidebarName
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    return { emoji: initials || 'IH', color: '#47b07d' };
  }, [sidebarName, sidebarUser]);

  const navLinks = useMemo(() => {
    return [
      ...baseLinks,
      ...(sidebarUser?.is_staff ? [{ to: '/admin/courses/new', label: 'Создать курс' }] : []),
    ];
  }, [sidebarUser]);

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__logo">
          <span className="app-shell__logo-mark">{avatar.emoji}</span>
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
            <div
              className="app-shell__avatar"
              style={{ background: `${avatar.color}22`, color: avatar.color }}
            >
              {avatar.emoji}
            </div>
            <div>
              <p className="app-shell__user-name">{sidebarName}</p>
              <p className="app-shell__user-role">{userRole}</p>
            </div>
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
