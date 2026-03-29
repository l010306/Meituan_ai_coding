import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, Building2 } from 'lucide-react';

export function LoginPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await axios.get('/api/v1/recruitment/jobs/clubs');
      setClubs(res.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch clubs", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!selectedClubId) return;
    setLoggingIn(true);
    const club = clubs.find(c => String(c.id) === selectedClubId);
    if (club) {
      localStorage.setItem('active_club', JSON.stringify(club));
      // Simulate a small delay for premium feel
      setTimeout(() => {
        navigate('/employer');
        window.location.reload(); // Force refresh to update Navbar etc.
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-50 rounded-3xl mb-6 shadow-sm shadow-indigo-100">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">社团管理后台</h1>
          <p className="text-slate-500">请选择您的社团进入管理中心</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              选择所属社团
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
              >
                <option value="">-- 请选择您的社团 --</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.clubName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedClubId || loading || loggingIn}
            className={`
              w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all
              ${!selectedClubId || loading || loggingIn
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-95"}
            `}
          >
            {loggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                进入管理后台
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            Demo 演示环境：直接选择即可登录
          </p>
        </div>
      </div>
    </div>
  );
}
