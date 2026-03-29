import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import axios from 'axios';

const API = '/api/v1/recruitment';

const STAGE_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '审核中', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  1: { label: '面试中', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  2: { label: '已录取', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  3: { label: '未通过', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [stageFilter, setStageFilter] = useState<number | null>(null);

  const fetchApps = async () => {
    // Get userId with a reliable fallback
    const userId = localStorage.getItem('userId') || '1001';
    
    // Set separate loading states
    if (applications.length > 0) setRefreshing(true);
    else setLoading(true);

    try {
      console.log(`Fetching applications for userId: ${userId}`);
      const res = await axios.get(`${API}/my-applications?userId=${userId}`);
      console.log('API Response:', res.data);
      setApplications(res.data?.data || []);
    } catch (e) {
      console.error('Fetch apps error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApps();
    window.addEventListener('application-submitted', fetchApps);
    return () => window.removeEventListener('application-submitted', fetchApps);
  }, []);

  const filtered = stageFilter !== null ? applications.filter(app => app.stage === stageFilter) : applications;

  return (
    <div style={{ padding: '24px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px', color: 'var(--text-primary)' }}>
            我的申请看板
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {stageFilter !== null ? STAGE_MAP[stageFilter].label : '全部'}记录：
            <span style={{ color: 'hsl(220,95%,65%)', fontWeight: 700, marginLeft: '4px' }}>{filtered.length}</span> / {applications.length}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '8px', borderRadius: '18px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setStageFilter(null)}
              style={{ 
                padding: '8px 18px', borderRadius: '12px', fontSize: '13px', border: 'none', cursor: 'pointer', fontWeight: 700,
                background: stageFilter === null ? 'var(--primary)' : 'transparent', color: stageFilter === null ? 'white' : '#64748b',
                transition: 'all 0.2s'
              }}>全部</button>
            {Object.entries(STAGE_MAP).map(([id, cfg]) => (
              <button 
                key={id} 
                onClick={() => setStageFilter(Number(id))}
                style={{ 
                  padding: '8px 18px', borderRadius: '12px', fontSize: '13px', border: 'none', cursor: 'pointer', fontWeight: 700,
                  background: stageFilter === Number(id) ? cfg.color : 'transparent', color: stageFilter === Number(id) ? 'white' : '#64748b',
                  transition: 'all 0.2s'
                }}>{cfg.label}</button>
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }} />

          <button onClick={fetchApps} disabled={loading || refreshing} style={{
            padding: '8px 20px',
            background: 'white',
            color: refreshing || loading ? '#94a3b8' : 'var(--primary)',
            border: '1px solid var(--primary)', borderRadius: '12px',
            cursor: refreshing || loading ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s', opacity: refreshing || loading ? 0.6 : 1
          }}>
            {refreshing || loading ? '⌛ 同步中' : '刷新列表'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '120px', color: '#64748b' }}>⏳ 正在同步申请数据...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '100px 24px',
          background: 'white', borderRadius: '32px',
          border: '2px dashed #e2e8f0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>📭</div>
          <h3 style={{ color: '#0f172a', fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>暂无{stageFilter !== null ? STAGE_MAP[stageFilter].label : ''}申请记录</h3>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            {stageFilter !== null ? `当前筛选条件下没有匹配的申请` : '快去「发现社团」开启你的大学新篇章吧！'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '32px' }}>
          {filtered.map(app => {
            const stage = STAGE_MAP[app.stage] || STAGE_MAP[0];
            return (
              <div
                key={app.id}
                onClick={() => setSelected(app)}
                style={{
                  background: 'white', border: '1px solid #f1f5f9',
                  borderRadius: '32px', padding: '40px', cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(99,102,241,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 40px rgba(0,0,0,0.03)';
                }}
              >
                {/* Stage Badge Floating */}
                <div style={{
                  position: 'absolute', top: '0', right: '0',
                  padding: '12px 24px', background: stage.bg, color: stage.color,
                  fontSize: '13px', fontWeight: 900, borderRadius: '0 0 0 24px'
                }}>
                  {stage.label}
                </div>

                {/* Content */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ 
                    width: '64px', height: '64px', borderRadius: '20px', 
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', fontWeight: 900, color: 'var(--primary)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {app.clubName?.[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
                      {app.clubName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{app.category || '综合社团'}</span>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>{app.jobTitle}</span>
                    </div>
                  </div>
                </div>
 
                {/* AI Matching Dashboard */}
                <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={14} color="var(--primary)" />
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 800 }}>AI 智能匹配分析</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: app.matchScore >= 70 ? '#10b981' : '#f59e0b' }}>
                      {app.matchScore}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'white', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: `linear-gradient(90deg, ${app.matchScore >= 70 ? '#10b981' : '#f59e0b'}, #6366f1)`,
                      width: `${Math.min(app.matchScore, 100)}%`,
                    }} />
                  </div>
                </div>
 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
                    🕒 提交于 {new Date(app.createTime).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button style={{ 
                    padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--primary)',
                    fontSize: '13px', fontWeight: 800, cursor: 'pointer' 
                  }}>
                    查看详情 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '540px', background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '40px', position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <button onClick={() => setSelected(null)} style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px',
            }}>✕</button>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {selected.clubName}
              </h2>
              <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{selected.jobTitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'AI 匹配分', val: `${selected.matchScore}分` },
                { label: '当前状态', val: STAGE_MAP[selected.stage]?.label || '审核中' },
                { label: '专业', val: selected.major || '—' },
                { label: '投递时间', val: new Date(selected.createTime).toLocaleDateString('zh-CN') },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '14px', background: 'var(--glass-bg)',
                  borderRadius: '12px', border: '1px solid var(--glass-border)',
                }}>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{item.val}</span>
                </div>
              ))}
            </div>

            {selected.personalStatement && (
              <div>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>已提交的自我介绍</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, background: 'var(--item-hover)', padding: '14px', borderRadius: '10px' }}>
                  {selected.personalStatement}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
