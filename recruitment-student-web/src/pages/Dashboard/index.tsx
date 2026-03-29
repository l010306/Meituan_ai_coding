import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Compass, FileText, User, LogOut, Search, Sparkles, Users, Sun, Moon, LayoutGrid } from 'lucide-react';
import './index.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('userName') || 'User';
  const [theme, setTheme] = React.useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  const [appCount, setAppCount] = React.useState<number>(0);
  const [profile, setProfile] = React.useState<any>(null);
  const [showProfile, setShowProfile] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchAppCount = async () => {
    const userId = localStorage.getItem('userId') || '1001';
    try {
      const res = await fetch(`/api/v1/recruitment/my-applications?userId=${userId}`);
      const data = await res.json();
      if (data.code === 200) {
        setAppCount(data.data?.length || 0);
      }
    } catch (e) {
      console.error("Failed to fetch app count", e);
    }
  };

  const fetchProfile = async () => {
    const userId = localStorage.getItem('userId') || '1001';
    try {
      const res = await fetch(`/api/v1/recruitment/profile/${userId}`);
      const data = await res.json();
      if (data.code === 200) {
        setProfile(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  };

  React.useEffect(() => {
    fetchAppCount();
    fetchProfile();
    window.addEventListener('application-submitted', fetchAppCount);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfile && !target.closest('.actions')) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('application-submitted', fetchAppCount);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard/discovery', icon: Compass, label: '发现社团' },
    { path: '/dashboard/applications', icon: FileText, label: '我的申请' },
    { path: '/dashboard/ai-resume', icon: Sparkles, label: 'AI 简历助手' },
    { path: '/dashboard/my-clubs', icon: Users, label: '我的社团' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <div className="logo-modern">
            <LayoutGrid size={24} strokeWidth={2.5} />
          </div>
          <h2>
            {profile?.realName 
              ? `你好！${profile.realName.charAt(0)}同学` 
              : userName !== 'User' 
                ? `你好！${userName.charAt(0)}同学`
                : '社团管理平台'}
          </h2>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.path === '/dashboard/applications' && appCount > 0 && (
                <span className="nav-badge">{appCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar" style={{ 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
              color: 'white', 
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)' 
            }}>
              {(profile?.realName || userName)[0]}
            </div>
            <div className="details">
              <span className="name">{profile?.realName || userName}</span>
              <span className="role">学生认证</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="search-pill glass-card">
            <Search size={18} className="icon" />
            <input type="text" placeholder="快速搜索社团..." />
          </div>
          <div className="actions" style={{ position: 'relative' }}>
            <button 
              className="theme-toggle glass-card"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{ marginRight: '12px' }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button 
              className={`profile-btn glass-card ${showProfile ? 'active' : ''}`}
              onClick={() => setShowProfile(!showProfile)}
            >
              <User size={18} />
            </button>

            {showProfile && profile && (
              <div className="profile-dropdown glass-card animate-in-up">
                <div className="profile-header">
                  <div className="avatar-glow">
                    <div className="avatar-large">{profile.realName?.[0] || 'U'}</div>
                  </div>
                  <h3>{profile.realName || '匿名同学'}</h3>
                  <span className="profile-tag">学生认证</span>
                </div>
                
                <div className="profile-grid">
                  <div className="grid-item">
                    <label>专业背景</label>
                    <p>{profile.major || '尚未设置'}</p>
                  </div>
                  <div className="grid-item">
                    <label>学号</label>
                    <p>{localStorage.getItem('userId') || '1001'}</p>
                  </div>
                  <div className="grid-item">
                    <label>就读院校</label>
                    <p>{profile.college || '信息工程学院'}</p>
                  </div>
                  <div className="grid-item">
                    <label>联系方式</label>
                    <p>{profile.contact || '尚未设置'}</p>
                  </div>
                </div>

                <div className="profile-footer">
                  <button className="action-btn-outline" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="content-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
