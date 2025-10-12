import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, FileText, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../base/Button';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { icon: FileText, label: 'Planillas', path: '/planillas' },
  ];

  if (profile?.is_admin) {
    menuItems.push({ icon: Users, label: 'Admin', path: '/admin' });
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="header-title">Planillas de Buena Fe</h1>
          <div className="header-actions">
            <span className="username">{profile?.username}</span>
            {profile?.is_admin && <span className="admin-badge">Admin</span>}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="layout-body">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  className="nav-item"
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
