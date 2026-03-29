import { useState, useEffect } from 'react';
import axios from 'axios';

const API = '/api/v1/recruitment';

const STAGE_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '审核中', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  1: { label: '面试中', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  2: { label: '已录取', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  3: { label: '未通过', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

// Full-featured candidate kanban for club admin
export function DashboardPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<number | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewResults, setReviewResults] = useState<Record<number, any>>({});

  const handleReview = async (app: any) => {
    setReviewingId(app.id);
    try {
      const res = await axios.post('/api/v1/ai/review-application', {
        jobTitle: app.jobTitle,
        jobDesc: '',
        studentStatement: app.personalStatement,
        studentTags: app.structuredData
      });
      const aiData = res.data?.data?.data;
      if (aiData) {
        setReviewResults(prev => ({ ...prev, [app.id]: aiData }));
      } else {
        alert("智能审核失败，未返回结构化数据");
      }
    } catch(e) {
      alert("网络错误");
    } finally {
      setReviewingId(null);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const activeClubRaw = localStorage.getItem('active_club');
      const activeClub = activeClubRaw ? JSON.parse(activeClubRaw) : null;
      
      const res = await axios.get(`${API}/all-applications`);
      let data = res.data?.data || [];
      
      if (activeClub) {
        // Filter by clubName if we have an active club session
        data = data.filter((app: any) => app.clubName === activeClub.clubName);
      }
      
      setCandidates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (id: number, stage: number) => {
    setUpdatingId(id);
    try {
      await axios.put(`${API}/application/${id}/stage?stage=${stage}`);
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
      if (selected?.id === id) setSelected({ ...selected, stage });
    } catch { alert('更新失败'); }
    finally { setUpdatingId(null); }
  };

  const filtered = stageFilter !== null ? candidates.filter(c => c.stage === stageFilter) : candidates;
  const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '80px auto 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>候选人智能看板</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            AI 已对所有申请进行匹配评分，共 <strong style={{ color: '#6366f1' }}>{candidates.length}</strong> 位候选人
          </p>
        </div>
        <button onClick={() => fetchCandidates()} style={{
          padding: '10px 20px', background: '#6366f1', color: 'white',
          border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px'
        }}>🔄 刷新数据</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {/* Stage filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[null, 0, 1, 2, 3].map(s => (
            <button key={String(s)} onClick={() => setStageFilter(s)} style={{
              padding: '8px 16px', borderRadius: '10px', border: '1px solid',
              borderColor: stageFilter === s ? '#6366f1' : '#e2e8f0',
              background: stageFilter === s ? '#6366f1' : 'white',
              color: stageFilter === s ? 'white' : '#374151',
              cursor: 'pointer', fontWeight: 600, fontSize: '12px', transition: 'all 0.15s',
            }}>
              {s === null ? '全部状态' : STAGE_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>⏳ 正在加载候选人数据...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px', background: 'white',
          borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontWeight: 800, color: '#374151', marginBottom: '8px' }}>暂无候选人</h3>
          <p style={{ fontSize: '14px' }}>学生提交申请后将显示在这里</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map((c) => {
            const stage = STAGE_CONFIG[c.stage] || STAGE_CONFIG[0];
            return (
              <div key={c.id} style={{
                background: 'white', borderRadius: '20px', padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: '#f1f5f9', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 900, color: '#6366f1', fontSize: '16px'
                    }}>
                      {c.realName ? c.realName[0] : '#'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{c.realName || '匿名候选人'}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.major || '未填写专业'}</div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: '8px',
                    background: stage.bg, color: stage.color,
                    fontSize: '12px', fontWeight: 700,
                  }}>
                    {stage.label}
                  </div>
                </div>

                {/* Job info */}
                <div style={{
                  padding: '8px 12px', background: '#f8fafc', borderRadius: '8px',
                  marginBottom: '12px', fontSize: '12px', color: '#64748b'
                }}>
                  🎯 {c.jobTitle || c.clubName}
                </div>

                {/* AI Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>AI 匹配分</span>
                  <div style={{
                    flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px'
                  }}>
                    <div style={{
                      height: '100%', background: scoreColor(c.matchScore),
                      borderRadius: '3px', width: `${c.matchScore}%`, transition: 'width 0.5s'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: scoreColor(c.matchScore) }}>
                    {c.matchScore}
                  </span>
                </div>

                {/* Statement preview */}
                {c.personalStatement && (
                  <p style={{
                    fontSize: '12px', color: '#64748b', lineHeight: 1.6,
                    marginBottom: '16px', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    "{c.personalStatement}"
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => setSelected(c)} style={{
                    flex: 1, padding: '8px', borderRadius: '10px',
                    border: '1px solid #e2e8f0', background: 'white',
                    color: '#374151', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                  }}>查看详情</button>
                  {c.stage === 0 && (
                    <button
                      disabled={updatingId === c.id}
                      onClick={() => updateStage(c.id, 1)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '10px',
                        border: 'none', background: '#6366f1', color: 'white',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                        opacity: updatingId === c.id ? 0.6 : 1,
                      }}>
                      邀约面试
                    </button>
                  )}
                  {c.stage === 1 && (
                    <>
                      <button onClick={() => updateStage(c.id, 2)} style={{
                        flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                        background: '#10b981', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                      }}>录取</button>
                      <button onClick={() => updateStage(c.id, 3)} style={{
                        padding: '8px 12px', borderRadius: '10px', border: 'none',
                        background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                      }}>❌</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '600px', background: 'white',
            borderRadius: '24px', padding: '40px', position: 'relative', maxHeight: '85vh', overflowY: 'auto'
          }}>
            <button onClick={() => setSelected(null)} style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8'
            }}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: '#f1f5f9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 900, color: '#6366f1', fontSize: '20px'
              }}>
                {selected.realName ? selected.realName[0] : '?'}
              </div>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>{selected.realName}</h2>
                <p style={{ color: '#64748b', fontSize: '13px' }}>{selected.major} · {selected.contactPhone}</p>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: 700 }}>AI 匹配分</span>
              <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ height: '100%', background: scoreColor(selected.matchScore), borderRadius: '4px', width: `${selected.matchScore}%` }} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 900, color: scoreColor(selected.matchScore) }}>{selected.matchScore}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>申请岗位</h4>
              <p style={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>{selected.jobTitle}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>个人介绍</h4>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                {selected.personalStatement || '未填写'}
              </p>
            </div>

            <div style={{ marginBottom: '28px', padding: '20px', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', color: '#6366f1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🤖 AI 智能评估辅助
                </h4>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto', marginRight: '16px' }}>
                  AI 建议不代表最终评价
                </div>
                <button onClick={() => handleReview(selected)} disabled={reviewingId === selected.id} style={{
                  background: reviewingId === selected.id ? '#e2e8f0' : '#6366f1', color: reviewingId === selected.id ? '#94a3b8' : 'white',
                  border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: reviewingId === selected.id ? 'not-allowed' : 'pointer'
                }}>
                  {reviewingId === selected.id ? '分析中...' : '开始匹配评估'}
                </button>
              </div>
              
              {reviewResults[selected.id] && (
                <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                    <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>🌟 匹配亮点</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: 1.6 }}>
                      {(reviewResults[selected.id].strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                    <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '4px' }}>⚠️ 潜在不足</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: 1.6 }}>
                      {(reviewResults[selected.id].weaknesses || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                  <div style={{ background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 600 }}>
                    💡 综合建议: {reviewResults[selected.id].recommendation}
                  </div>
                </div>
              )}
            </div>

            {/* Stage change buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {selected.stage !== 1 && (
                <button onClick={() => updateStage(selected.id, 1)} style={{
                  flex: 1, padding: '12px', background: '#6366f1', color: 'white',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700
                }}>📅 邀约面试</button>
              )}
              {selected.stage !== 2 && (
                <button onClick={() => updateStage(selected.id, 2)} style={{
                  flex: 1, padding: '12px', background: '#10b981', color: 'white',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700
                }}>✅ 录取通过</button>
              )}
              {selected.stage !== 3 && (
                <button onClick={() => updateStage(selected.id, 3)} style={{
                  padding: '12px 20px', background: '#fee2e2', color: '#ef4444',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700
                }}>❌ 淘汰</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
