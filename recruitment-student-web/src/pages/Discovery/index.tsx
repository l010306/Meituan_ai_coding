import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Bot } from 'lucide-react';

const API = '/api/v1';

const CATEGORIES = [
  { name: '全部', icon: '🌟' },
  { name: '体育', icon: '⚽' },
  { name: '艺术', icon: '🎨' },
  { name: '技术', icon: '💻' },
  { name: '公益', icon: '💚' },
  { name: '学术', icon: '📚' },
  { name: '舞蹈', icon: '💃' },
  { name: '影视', icon: '🎬' },
];

function parseTagsSafe(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  let val = raw;
  for (let i = 0; i < 4; i++) {
    if (typeof val !== 'string') break;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
      val = parsed;
    } catch { break; }
  }
  if (typeof val === 'string' && val.length > 0) return [val];
  return [];
}

interface Job {
  id: number; clubName: string; category: string; title: string;
  description: string; requirementTags: any; establishedYear: string;
  orgLevel: string; guidanceUnit: string; mainActivities: string;
  representativeActivities: string; memberSize: string;
  activityFrequency: string; slots: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  clubs?: any[];
  provider?: string;
  elapsedMs?: number;
}

// ════════════════════════════════════════════════ AI Chat Panel ════════════
function AIChatPanel({ onSelectClub }: { onSelectClub: (id: number) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: '👋 你好！我是**AI社团推荐助手**。\n\n告诉我你的兴趣、性格 and 空闲时间，我会为你推荐最适合的社团！\n\n💡 **试试这样说**：\n- "我喜欢编程和算法，每周有6小时空闲"\n- "我是一个内向但喜欢读书的人"\n- "我想找一个能锻炼身体的社团"',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('mock');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get(`${API}/ai/config`).then(r => {
      setProvider(r.data?.data?.activeProvider || 'mock');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'assistant' || (!m.clubs)).map(m => ({
        role: m.role, content: m.content
      }));
      const res = await axios.post(`${API}/ai/chat`, {
        message: userMsg.content, history, category: '',
      });
      const data = res.data?.data;
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data?.response || '(无响应)',
        clubs: data?.matchedClubs || [],
        provider: data?.provider,
        elapsedMs: data?.elapsedMs,
      };
      setMessages(prev => [...prev, aiMsg]);
      setProvider(data?.provider || provider);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ 连接失败: ' + (e?.response?.data?.message || e?.message || '网络错误'),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '我喜欢编程和参加算法竞赛',
    '我热爱运动，尤其是足球',
    '我对摄影和视频制作感兴趣',
    '我想找一个文艺类的社团',
  ];

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', 
      height: 'calc(100vh - 240px)', // Compensate for header and Discovery tabs
      minHeight: '400px',
      gap: '16px'
    }}>
      {/* Provider badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            width: '40px', height: '40px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}>
            <Bot size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>AI 社团推荐</span>
              <Sparkles size={16} color="var(--primary)" />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, opacity: 0.8 }}>
              对话式智能匹配 · 极速获得建议
            </span>
          </div>
        </div>
        <span style={{
          fontSize: '11px', padding: '4px 12px', borderRadius: '8px',
          background: provider === 'mock' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
          color: provider === 'mock' ? '#f59e0b' : '#10b981', fontWeight: 700,
        }}>
          {provider === 'mock' ? '⚡ Mock 模式' : `🌐 ${provider.toUpperCase()}`}
        </span>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: 'auto', paddingRight: '8px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {/* Bubble */}
            <div style={{
              maxWidth: '85%', padding: '16px 20px', borderRadius: '18px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, hsl(220,95%,50%), hsl(280,80%,55%))'
                : 'var(--glass-bg)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {/* Render markdown-ish bold */}
              {msg.content.split('\n').map((line, li) => (
                <div key={li} style={{ marginBottom: line === '' ? '8px' : '2px' }}>
                  {renderLine(line)}
                </div>
              ))}
            </div>

            {/* Matched clubs cards */}
            {msg.clubs && msg.clubs.length > 0 && (
              <div style={{
                display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto',
                paddingBottom: '4px', maxWidth: '85%',
              }}>
                {msg.clubs.slice(0, 5).map((club: any) => (
                  <div key={club.id} onClick={() => onSelectClub(club.id)}
                    style={{
                      minWidth: '160px', padding: '14px', borderRadius: '14px',
                      background: 'var(--card-bg)', border: '1px solid var(--glass-border)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: 'var(--shadow)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {club.clubName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700 }}>
                      {club.category} · 匹配 {typeof club.matchScore === 'number' ? club.matchScore.toFixed(0) : club.matchScore}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Meta info */}
            {msg.provider && (
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                via {msg.provider} · {msg.elapsedMs}ms
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
              padding: '16px 24px', borderRadius: '18px',
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => { setInput(p); }}
              style={{
                padding: '8px 14px', borderRadius: '20px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
              }}>{p}</button>
          ))}
        </div>
      )}

      {/* Input bar (Sticky at bottom) */}
      <div style={{
        display: 'flex', gap: '12px', marginTop: 'auto',
        background: 'var(--main-bg)', borderRadius: '16px',
        padding: '12px', border: '1px solid var(--glass-border)',
        position: 'sticky', bottom: '0',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(16px)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="描述你的兴趣爱好，让 AI 为你精准匹配..."
          style={{
            flex: 1, height: '44px', background: 'transparent',
            border: 'none', padding: '0 14px', color: 'var(--text-primary)',
            fontSize: '14px', outline: 'none',
          }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{
            padding: '0 24px', background: loading || !input.trim()
              ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '12px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '14px', transition: 'all 0.2s',
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
          }}>
          {loading ? '⏳' : '发送'}
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#94a3b8', opacity: 0.8 }}>
        💡 AI 生成建议仅供参考，请根据实际情况甄别
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function renderLine(line: string) {
  // Simple markdown rendering for bold, headers, and list items
  if (line.startsWith('### ')) return <div style={{ fontWeight: 800, fontSize: '15px', marginTop: '8px' }}>{line.slice(4)}</div>;
  if (line.startsWith('## ')) return <div style={{ fontWeight: 900, fontSize: '16px', marginTop: '10px' }}>{line.slice(3)}</div>;
  if (line.startsWith('# ')) return <div style={{ fontWeight: 900, fontSize: '18px', marginTop: '12px' }}>{line.slice(2)}</div>;
  if (line.startsWith('- ')) return <div style={{ paddingLeft: '12px' }}>• {renderBold(line.slice(2))}</div>;

  return <>{renderBold(line)}</>;
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return <>{parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ color: '#a5b4fc' }}>{part}</strong> : <span key={i}>{part}</span>
  )}</>;
}

// ════════════════════════════════════════════════ Main Component ════════════
const Discovery: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'ai' | 'all'>(
    (localStorage.getItem('discovery_mode') as 'ai' | 'all') || 'all'
  );
  useEffect(() => {
    localStorage.setItem('discovery_mode', mode);
  }, [mode]);
  const [category, setCategory] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ realName: '', contact: '', major: '', statement: '', portfolioUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [_file, setFile] = useState<File | null>(null);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [_structuredData, setStructuredData] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  void _file; void _structuredData;

  // Get userId with a reliable fallback
  const getAuthUserId = () => localStorage.getItem('userId') || '1001';
  const userId = getAuthUserId();

  // Auto pre-fill form from user profile when modal opens
  useEffect(() => {
    if (showApply) {
      fetch(`/api/v1/recruitment/profile/${userId}`)
        .then(r => r.json())
        .then(data => {
          if (data.code === 200 && data.data) {
            setForm(prev => ({
              ...prev,
              realName: data.data.realName && data.data.realName !== '同学' ? data.data.realName : prev.realName,
              contact: data.data.contact || prev.contact,
              major: data.data.major && data.data.major !== '未知专业' ? data.data.major : prev.major,
            }));
          }
        })
        .catch(() => {});
    }
  }, [showApply]);

  const handleLoadSavedResume = () => {
    const saved = localStorage.getItem('ai_resume');
    if (saved) {
      const data = JSON.parse(saved);
      setForm(prev => ({ ...prev, statement: data.statement }));
      setStructuredData(JSON.stringify(data.structuredData));
      alert("已成功加载您之前在'AI简历助手'页生成的简历内容！");
    } else {
      alert("您还没有在'AI简历助手'页面保存过简历哦。");
    }
  };

  const handleGenerateResume = async () => {
    if (!form.statement.trim()) {
      alert("请先输入一些简单的关键词或草稿，AI会帮您润色成得体的自我介绍");
      return;
    }
    setGeneratingResume(true);
    try {
      const profRes = await fetch(`/api/v1/recruitment/profile/${userId}`);
      const profData = await profRes.json();
      const userProfile = profData.data || {};

      const res = await fetch('/api/v1/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: form.statement,
          userProfile
        })
      });
      const data = await res.json();
      if (data.code === 200 && data.data?.data) {
        setForm(prev => ({ ...prev, statement: data.data.data.statement }));
        setStructuredData(JSON.stringify(data.data.data.structuredData));
      } else {
        alert("AI生成失败，请稍后再试");
      }
    } catch(e) {
      alert("网络错误");
    } finally {
      setGeneratingResume(false);
    }
  };

  const fetchAppliedStatus = async () => {
    try {
      const res = await axios.get(`${API}/recruitment/my-applications?userId=${userId}`);
      if (res.data?.code === 200 && Array.isArray(res.data.data)) {
        setAppliedJobIds(res.data.data.map((app: any) => app.jobId));
      }
    } catch (e) { console.error("Failed to fetch applied status", e); }
  };

  useEffect(() => { 
    if (mode === 'all') {
      if (!isSearched) loadRecommendations();
      else search();
    }
    fetchAppliedStatus();
  }, [mode]);

  const loadRecommendations = async () => {
    setLoading(true); setError(''); setIsSearched(false);
    try {
      const res = await axios.get(`/api/v1/recommendation/jobs/${userId}`);
      if (res.data?.code === 200 && Array.isArray(res.data.data)) {
        // Map backend Map<String, Object> { job: Job, matchScore: num, reason: str } to Job[]
        const recJobs = res.data.data.map((item: any) => {
          return { ...item.job, matchScore: item.matchScore, recommendationReason: item.reason };
        });
        setJobs(recJobs);
      } else {
        setJobs([]);
      }
    } catch (e: any) { 
      const errMsg = e.response?.data?.message || e.message;
      setError('加载推荐失败: ' + errMsg); 
      console.error('Recommendation Error Detail:', e);
    }
    finally { setLoading(false); }
  };

  const loadAll = async () => {
    loadRecommendations();
  };

  const search = async () => {
    setLoading(true); setError(''); setPage(1); setIsSearched(true);
    try {
      const cat = category === '全部' ? '' : category;
      const res = await axios.get(`${API}/recruitment/jobs/search?category=${encodeURIComponent(cat)}&keyword=${encodeURIComponent(keyword)}`);
      setJobs(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { setError('搜索失败'); setJobs([]); }
    finally { setLoading(false); }
  };

  const loadJobDetail = async (id: number) => {
    try {
      const res = await axios.get(`${API}/recruitment/job/${id}`);
      if (res.data?.data) setSelectedJob(res.data.data);
    } catch { /* ignore */ }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    if (!form.realName || !form.contact || !form.major || !form.statement) {
      alert('请填写所有必填项'); return;
    }
    setSubmitting(true);
    try {
      const currentId = getAuthUserId();
      console.log(`[Discovery] Submitting application for user: ${currentId}`);
      
      const resumeRes = await axios.post(`${API}/recruitment/resume/submit-form`, null, {
        params: { userId: currentId, realName: form.realName, contact: form.contact, major: form.major, personalStatement: form.statement }
      });
      const studentId = resumeRes.data?.data?.id;
      
      // Submit the actual application link
      const applyRes = await axios.post(`${API}/recruitment/apply/${selectedJob.id}?studentId=${studentId}`);
      
      if (applyRes.data?.code !== 200) {
        alert(applyRes.data?.message || '投递失败');
        setSubmitting(false);
        return;
      }

      alert('✅ 投递成功！这就带您去查看进度');

      // Dispatch event to sync sidebar badge and other components
      window.dispatchEvent(new CustomEvent('application-submitted'));
      fetchAppliedStatus(); // Update local status

      setShowApply(false); setSelectedJob(null);
      setForm({ realName: '', contact: '', major: '', statement: '', portfolioUrl: '' });
      
      // Auto-jump to applications to see the result
      setTimeout(() => navigate('/dashboard/applications'), 1000);
    } catch (e: any) { 
      const msg = e.response?.data?.message || '提交失败，请重试';
      alert(msg); 
    }
    finally { setSubmitting(false); }
  };

  const totalPages = Math.ceil(jobs.length / pageSize);
  const paged = jobs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ padding: '24px 20px 20px' }}>
      {/* Mode Tabs (Sticky) */}
      <div style={{ 
        display: 'flex', justifyContent: 'center', marginBottom: '32px',
        position: 'sticky', top: '-24px', zIndex: 99,
        background: 'var(--main-bg)', padding: '16px 0',
        margin: '-24px -20px 32px -20px', // Offset parent padding
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          display: 'inline-flex', background: 'var(--glass-bg)',
          borderRadius: '16px', padding: '6px', border: '1px solid var(--glass-border)'
        }}>
          {([['all', '社团广场'], ['ai', 'AI 智能推荐']] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m as any)} style={{
              padding: '10px 36px', borderRadius: '12px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '14px',
              background: mode === m ? 'hsl(220,95%,50%)' : 'transparent',
              color: mode === m ? 'white' : '#94a3b8',
              transition: 'all 0.2s',
              boxShadow: mode === m ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* AI Chat Mode */}
      {mode === 'ai' && (
        <AIChatPanel onSelectClub={id => loadJobDetail(id)} />
      )}

      {/* All Mode Controls */}
      {mode === 'all' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center' }}>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--glass-border)',
                borderRadius: '12px', padding: '10px 16px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}>
              {CATEGORIES.map(c => <option key={c.name} value={c.name} style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>{c.name}</option>)}
            </select>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="在社团广场中精准搜索..."
              style={{
                flex: 1, height: '44px', background: 'var(--input-bg)',
                border: '1px solid var(--glass-border)', borderRadius: '12px',
                padding: '0 16px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }} />
            <button onClick={search} style={{
              padding: '0 20px', height: '44px', background: 'rgba(37,99,235,0.2)',
              border: '1px solid rgba(37,99,235,0.3)', color: 'hsl(220,95%,70%)',
              borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '14px',
            }}>筛选</button>
            <button onClick={loadAll} style={{
              padding: '0 16px', height: '44px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', color: '#64748b',
              borderRadius: '12px', cursor: 'pointer', fontSize: '13px',
            }}>重置</button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '15px' }}>⏳ 推荐算法加载中...</div>}
          {error && <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#fca5a5', marginBottom: '24px' }}>⚠️ {error}</div>}
          {!loading && jobs.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#64748b', fontSize: '13px' }}>
                {isSearched ? (
                  <>共找到 <span style={{ color: 'hsl(220,95%,65%)', fontWeight: 700 }}>{jobs.length}</span> 个匹配社团</>
                ) : (
                  <>✨ 这里的 <span style={{ color: 'hsl(30,95%,60%)', fontWeight: 700 }}>12</span> 个社团最懂你的需求 (推荐)</>
                )}
              </p>
              {isSearched && (
                <span style={{ color: '#64748b', fontSize: '12px' }}>当前第 {page}/{totalPages} 页</span>
              )}
            </div>
          )}

          {/* Job Cards Grid */}
          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {paged.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>暂无社团数据</div>
              ) : paged.map(job => (
                <div key={job.id} onClick={() => setSelectedJob(job)}
                  style={{
                    background: 'var(--card-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: '20px', padding: '24px', cursor: 'pointer',
                    transition: 'all 0.25s', backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--shadow)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,99,235,0.4)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(220,95%,65%)', background: 'rgba(37,99,235,0.12)', padding: '4px 10px', borderRadius: '6px' }}>
                      {job.category || '综合'}
                    </span>
                    {(job as any).matchScore !== undefined && (
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800 }}>匹配度 {(job as any).matchScore.toFixed(0)}%</span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>EST. {job.establishedYear || '—'}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>{job.clubName || '未知社团'}</h3>
                  <p style={{ fontSize: '14px', color: 'hsl(220,95%,65%)', fontWeight: 600, marginBottom: '12px' }}>{job.title || '招募中'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>📍 {job.guidanceUnit || '未填写'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {parseTagsSafe(job.requirementTags).slice(0, 3).map((tag, i) => (
                      <span key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination (Only show for search results) */}
          {!loading && totalPages > 1 && isSearched && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center', marginTop: '20px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 24px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: page === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>← 上一页</button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>第 {page} 页 / 共 {totalPages} 页</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 24px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: page === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>下一页 →</button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedJob && !showApply && (
        <div onClick={() => setSelectedJob(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '48px', position: 'relative' }}>
            <button onClick={() => setSelectedJob(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(220,95%,50%)', background: 'rgba(37,99,235,0.12)', padding: '4px 12px', borderRadius: '6px' }}>{selectedJob.category}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--item-hover)', padding: '4px 12px', borderRadius: '6px' }}>{selectedJob.orgLevel}</span>
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>{selectedJob.clubName}</h2>
              <p style={{ color: 'hsl(220,95%,50%)', fontWeight: 700, fontSize: '16px' }}>{selectedJob.title}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: '挂靠单位', val: selectedJob.guidanceUnit }, { label: '成立年份', val: selectedJob.establishedYear },
                { label: '活动频率', val: selectedJob.activityFrequency }, { label: '成员规模', val: selectedJob.memberSize },
              ].map(item => (
                <div key={item.label} style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>{item.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.val || '—'}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', color: 'hsl(220,95%,50%)', fontWeight: 700, marginBottom: '10px' }}>社团简介</h4>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{selectedJob.description}</p>
            </div>

            {selectedJob.representativeActivities && (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '14px', color: 'hsl(220,95%,50%)', fontWeight: 700, marginBottom: '10px' }}>品牌活动</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{selectedJob.representativeActivities}</p>
              </div>
            )}

            <button 
              onClick={() => !appliedJobIds.includes(selectedJob.id) && setShowApply(true)} 
              disabled={appliedJobIds.includes(selectedJob.id)}
              style={{ 
                width: '100%', height: '52px', 
                background: appliedJobIds.includes(selectedJob.id) ? 'var(--item-hover)' : 'hsl(220,95%,55%)', 
                color: appliedJobIds.includes(selectedJob.id) ? 'var(--text-secondary)' : 'white', 
                border: appliedJobIds.includes(selectedJob.id) ? '1px solid var(--glass-border)' : 'none', 
                borderRadius: '14px', 
                cursor: appliedJobIds.includes(selectedJob.id) ? 'not-allowed' : 'pointer', 
                fontWeight: 700, fontSize: '16px', 
                boxShadow: appliedJobIds.includes(selectedJob.id) ? 'none' : '0 4px 20px rgba(37,99,235,0.3)' 
              }}>
              {appliedJobIds.includes(selectedJob.id) ? '您已投递过该社团' : '立即投递申请 →'}
            </button>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApply && selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>投递申请</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>{selectedJob.clubName}</p>
            <div style={{ padding: '12px 16px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', color: 'var(--primary)' }}>
              💡 简历 PDF 上传为<strong>非必选项</strong>，社团会根据您的自我介绍进行初步筛选
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: '姓名 *', key: 'realName', placeholder: '真实姓名' },
                { label: '联系方式 *', key: 'contact', placeholder: '手机号或微信' },
                { label: '专业 *', key: 'major', placeholder: '所在专业' },
              ].map(f => (
                <div key={f.key} style={f.key === 'major' ? { gridColumn: '1/-1' } : {}}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: '100%', height: '42px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>作品展示链接 (可选)</label>
              <input value={form.portfolioUrl} onChange={e => setForm({ ...form, portfolioUrl: e.target.value })}
                placeholder="https://github.com/yourname 或 个人网站"
                style={{ width: '100%', height: '42px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>附件简历 (PDF, 可选)</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ width: '100%', color: 'var(--text-secondary)', fontSize: '13px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>自我介绍 *</label>
                <button onClick={handleLoadSavedResume} style={{
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', borderRadius: '6px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  marginRight: '8px'
                }}>
                  载入 AI 简历
                </button>
                <button onClick={handleGenerateResume} disabled={generatingResume} style={{
                  background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
                  color: 'var(--primary)', borderRadius: '6px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  opacity: generatingResume ? 0.6 : 1
                }}>
                  {generatingResume ? '生成中...' : '一键润色'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', opacity: 0.8 }}>
                ℹ️ AI 润色内容可能存在偏差，请在保存前进行人工核对。
              </div>
              <textarea value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })}
                placeholder="展示你的才华与动力..."
                style={{ width: '100%', height: '140px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleApply} disabled={submitting}
                style={{ flex: 1, height: '48px', background: 'hsl(220,95%,50%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '15px', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? '提交中...' : '确认提交申请'}
              </button>
              <button onClick={() => setShowApply(false)}
                style={{ padding: '0 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discovery;
