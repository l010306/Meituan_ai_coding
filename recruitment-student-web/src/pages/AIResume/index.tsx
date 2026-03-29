import React, { useState } from 'react';
import { Sparkles, Save, Trash2 } from 'lucide-react';

const AIResumePage: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id?: number; statement: string; structuredData: any } | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  React.useEffect(() => {
    const h = localStorage.getItem('ai_resume_history');
    if (h) setHistory(JSON.parse(h));
  }, []);

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      alert("请输入关键词、兴趣或简短的经历描述");
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });
      const data = await res.json();
      if (data.code === 200 && data.data?.data) {
        setResult(data.data.data);
        const newRecord = { 
          id: Date.now(), 
          timestamp: new Date().toLocaleString(),
          ...data.data.data 
        };
        const newHistory = [newRecord, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('ai_resume_history', JSON.stringify(newHistory));
      } else {
        alert("生成失败，请稍后再试");
      }
    } catch (e) {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    localStorage.setItem('ai_resume', JSON.stringify(result));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setKeywords('');
    setResult(null);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles color="var(--primary)" size={32} />
          AI 简历辅助生成
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>
          输入你的兴趣爱好、技能专长或一段随笔，AI 将为你润色成标准、高质量的社团申请书。
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '32px', transition: 'all 0.5s ease' }}>
        {/* Input area */}
        <section className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>输入您的草稿 / 关键词</h3>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="例如：我喜欢打篮球，有过剪辑比赛短视频的经验，希望能加入相关社团提升技术..."
            style={{
              width: '100%', height: '260px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '16px', padding: '20px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none', resize: 'none', lineHeight: 1.6
            }}
          />
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', opacity: 0.8 }}>
            💡 AI 生成内容仅供参考，请根据实际情况甄别。
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                flex: 1, height: '52px', background: 'hsl(220,95%,50%)', color: 'white', border: 'none',
                borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '16px',
                boxShadow: '0 4px 20px rgba(37,99,235,0.4)', opacity: loading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? '🚀 正在创作中...' : <>✨ 立即智能生成</>}
            </button>
            <button onClick={handleClear} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '12px', padding: '0 20px', cursor: 'pointer' }}>
              <Trash2 size={20} />
            </button>
          </div>
        </section>

        {/* Result area */}
        {result && (
          <section className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--glass-bg)', border: '1px solid var(--primary)', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase' }}>AI 生成的自我介绍</h3>
              <button 
                onClick={handleSave} 
                style={{
                  background: saved ? '#10b981' : 'rgba(99,102,241,0.1)', color: saved ? 'white' : '#6366f1',
                  border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {saved ? <>✅ 已保存</> : <><Save size={14} /> 保存至我的简历</>}
              </button>
            </div>
            
            <div style={{ 
              background: 'var(--item-hover)', borderRadius: '16px', padding: '20px', color: 'var(--text-primary)',
              fontSize: '15px', lineHeight: 1.8, marginBottom: '24px', minHeight: '180px', whiteSpace: 'pre-wrap'
            }}>
              {result.statement}
            </div>

            <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>提取的匹配标签</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.structuredData.skills.map((s: string) => (
                <span key={s} style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>#{s}</span>
              ))}
              {result.structuredData.interests.map((i: string) => (
                <span key={i} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>@{i}</span>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--item-hover)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              👤 性格特质：{result.structuredData.personality}
            </div>
          </section>
        )}
        {/* History Area */}
        <section className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', gridColumn: result ? '1/-1' : 'auto', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>最近生成记录</h3>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>暂无记录</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {history.map(h => (
                <div key={h.id} onClick={() => setResult(h)} style={{ 
                   padding: '12px', background: 'var(--item-hover)', borderRadius: '12px', cursor: 'pointer',
                   border: result?.id === h.id ? '1px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, marginBottom: '4px' }}>{h.timestamp}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.statement.substring(0, 30)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AIResumePage;
