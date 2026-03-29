import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Cpu, Users, LayoutGrid, Sparkles } from "lucide-react";

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { label: "社团招新", path: "/employer", icon: <Users className="w-4 h-4" /> },
    { label: "AI 创作中枢", path: "/ai-creative", icon: <Sparkles className="w-4 h-4 text-indigo-500" /> },
    { label: "候选人看板", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  const activeClubRaw = localStorage.getItem('active_club');
  const activeClub = activeClubRaw ? JSON.parse(activeClubRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('active_club');
    window.location.href = '/login';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <LayoutGrid size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-800">
                {activeClub ? activeClub.clubName : '社团管理平台'}
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? "bg-white text-primary shadow-sm ring-1 ring-gray-200/50" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"}
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/engineering"
              className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50/50 border border-amber-200/50 hover:bg-amber-100 transition-all uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg shadow-sm shadow-amber-100/50"
            >
              <Cpu className="w-3.5 h-3.5 stroke-[2.5px]" />
              工程面板 (DEBUG)
            </Link>
            <div className="w-px h-4 bg-slate-200" />
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
