import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ENG_API = '/api/v1/engineering';

// ─────────────────────────────────────────────────────── Tab definitions ────
const TABS = [
  { id: 'algo', label: '⚙️ 算法调试', icon: '⚙️' },
  { id: 'llm', label: '🤖 LLM 接口', icon: '🤖' },
  { id: 'img', label: '🖼️ 图像接口', icon: '🖼️' },
  { id: 'db', label: '🗄️ 数据库管理', icon: '🗄️' },
  { id: 'status', label: '🟢 系统状态', icon: '🟢' },
];

const ALGO_IDS = ['cosine', 'jaccard', 'bm25', 'gale_shapley'];

// ─────────────────────────────────────────────── Shared style utils ─────────
const card: React.CSSProperties = {
  background: 'white', borderRadius: '16px', padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
  marginBottom: '20px',
};

const sectionTitle = (t: string) => (
  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>{t}</h3>
);

const badge = (label: string, color: string, bg: string) => (
  <span style={{
    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
    color, background: bg,
  }}>{label}</span>
);

const primaryBtn = (label: string, onClick: () => void, loading = false, small = false): React.JSX.Element => (
  <button onClick={onClick} disabled={loading} style={{
    padding: small ? '7px 16px' : '10px 24px',
    background: loading ? '#e2e8f0' : '#6366f1', color: loading ? '#94a3b8' : 'white',
    border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontSize: small ? '12px' : '13px', transition: 'all 0.15s',
  }}>{label}</button>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 14px', border: '1px solid #e2e8f0',
  borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#0f172a',
  background: 'white', boxSizing: 'border-box',
};

const label = (text: string) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{text}</label>
);

// ══════════════════════════════════════════════════ Sub-panels ══════════════

// ── 1. Algorithm Panel ──────────────────────────────────────────────────────
function AlgorithmPanel() {
  const [algoStatus, setAlgoStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testJob, setTestJob] = useState('["文学写作","诗歌创作","团队合作"]');
  const [testResume, setTestResume] = useState('{"skills":["写作","文学","读书"],"experience":"热爱文学创作"}');
  const [testAlgo, setTestAlgo] = useState('cosine');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${ENG_API}/algorithm`);
      setAlgoStatus(res.data?.data);
    } catch (e) {
      setAlgoStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const switchAlgo = async (id: string) => {
    setSwitching(true);
    try {
      await axios.post(`${ENG_API}/algorithm`, { algorithm: id });
      await fetchStatus();
    } catch { alert('切换失败'); }
    finally { setSwitching(false); }
  };

  const testAlgorithm = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post(`${ENG_API}/algorithm/test`, {
        jobTags: testJob,
        resumeJson: testResume,
        algorithm: testAlgo,
      });
      setTestResult(res.data?.data);
    } catch (e: any) {
      setTestResult({ error: e?.response?.data?.message || e?.message });
    } finally {
      setTesting(false);
    }
  };

  const statusColors: Record<string, [string, string]> = {
    ACTIVE: ['#10b981', 'rgba(16,185,129,0.1)'],
    EXPERIMENTAL: ['#f59e0b', 'rgba(245,158,11,0.1)'],
    DISABLED: ['#ef4444', 'rgba(239,68,68,0.1)'],
  };

  return (
    <div>
      {/* Active algorithm card */}
      <div style={card}>
        {sectionTitle('当前生产算法')}
        {loading ? <div style={{ color: '#94a3b8' }}>加载中...</div> : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#f0fdf4', borderRadius: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <div>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                {algoStatus?.available?.find((a: any) => a.id === algoStatus?.active)?.name || algoStatus?.active}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px' }}>
                所有新增申请将使用此算法计算匹配分
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Algorithm comparison grid */}
      <div style={card}>
        {sectionTitle('算法库 — 点击切换生产算法')}

        {/* Honest status note */}
        <div style={{
          padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#1d4ed8',
        }}>
          ℹ️ 全部四种算法均已在后端实现并可用。<strong>Gale-Shapley</strong> 标记为"实验性"，因为其槽位供需权重参数仍在调优中。
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {(algoStatus?.available || []).map((algo: any) => {
            const [color, bg] = statusColors[algo.status] || ['#64748b', '#f1f5f9'];
            const isActive = algoStatus?.active === algo.id;
            return (
              <div key={algo.id} style={{
                padding: '18px', borderRadius: '14px', border: '2px solid',
                borderColor: isActive ? '#6366f1' : '#e2e8f0',
                background: isActive ? '#f5f3ff' : 'white', position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', top: '-1px', right: '12px',
                    fontSize: '10px', fontWeight: 800, color: 'white', background: '#6366f1',
                    padding: '2px 10px', borderRadius: '0 0 8px 8px',
                  }}>当前使用</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{algo.name}</span>
                  {badge(algo.status, color, bg)}
                </div>

                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                  {algo.description}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {Object.entries(algo.params || {}).map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '5px',
                      background: '#f1f5f9', color: '#374151', fontFamily: 'monospace',
                    }}>{k}: {String(v)}</span>
                  ))}
                </div>

                {!isActive && (
                  <button onClick={() => switchAlgo(algo.id)} disabled={switching} style={{
                    width: '100%', padding: '8px', border: '1px solid #e2e8f0',
                    borderRadius: '8px', background: 'white', color: '#374151',
                    cursor: switching ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700,
                  }}>
                    {switching ? '切换中...' : '切换至此算法'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live test */}
      <div style={card}>
        {sectionTitle('算法实时测试')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
          <div>
            {label('岗位标签 JSON 数组')}
            <textarea value={testJob} onChange={e => setTestJob(e.target.value)}
              style={{ ...inputStyle, height: '80px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} />
          </div>
          <div>
            {label('简历结构化 JSON')}
            <textarea value={testResume} onChange={e => setTestResume(e.target.value)}
              style={{ ...inputStyle, height: '80px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          {label('测试算法')}
          <select value={testAlgo} onChange={e => setTestAlgo(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 1 }}>
            {ALGO_IDS.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          {primaryBtn(testing ? '⏳ 计算中...' : '▶ 运行测试', testAlgorithm, testing)}
        </div>
        {testResult && (
          <div style={{
            padding: '14px', borderRadius: '12px',
            background: testResult.error ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${testResult.error ? '#fecaca' : '#bbf7d0'}`,
          }}>
            {testResult.error ? (
              <p style={{ color: '#ef4444', fontSize: '13px' }}>❌ {testResult.error}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { k: '算法', v: testResult.algorithm },
                  { k: '匹配分', v: String(testResult.score) },
                  { k: '耗时', v: `${testResult.elapsedMs}ms` },
                ].map(item => (
                  <div key={item.k}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>{item.k}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{item.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. LLM Panel ────────────────────────────────────────────────────────────
// ── 2. LLM Panel ────────────────────────────────────────────────────────────
function LLMPanel() {
  const [llmConfig, setLlmConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testPrompt, setTestPrompt] = useState('你好，请介绍一下你自己。');
  const [activeProvider, setActiveProvider] = useState('mock');

  // Form state for editing
  const [editProvider, setEditProvider] = useState('gemini');
  const [form, setForm] = useState({
    apiKey: '',
    endpoint: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1024,
  });

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/v1/ai/config');
      const data = res.data?.data;
      setLlmConfig(data);
      setActiveProvider(data?.activeProvider || 'mock');
      
      // Initialize form with active or first provider
      const p = data?.activeProvider || 'gemini';
      const cfg = data?.providers?.[p];
      if (cfg) {
        setEditProvider(p);
        setForm({
          apiKey: '', // Never show API Key from server for security
          endpoint: cfg.endpoint || '',
          model: cfg.model || '',
          temperature: cfg.temperature || 0.7,
          maxTokens: cfg.maxTokens || 1024,
        });
      }
    } catch (e) {
      console.error('Failed to fetch LLM config', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleProviderSelect = (p: string) => {
    setEditProvider(p);
    const cfg = llmConfig?.providers?.[p];
    if (cfg) {
      setForm({
        apiKey: '',
        endpoint: cfg.endpoint || '',
        model: cfg.model || '',
        temperature: cfg.temperature || 0.7,
        maxTokens: cfg.maxTokens || 1024,
      });
    }
  };

  const saveConfig = async (setActive = false) => {
    try {
      await axios.put('/api/v1/ai/config', {
        provider: editProvider,
        ...form,
        setActive
      });
      alert('配置已保存' + (setActive ? '并切换为当前活跃' : ''));
      fetchConfig();
    } catch (e: any) {
      alert('保存失败: ' + (e.response?.data?.message || e.message));
    }
  };

  const switchActive = async (p: string) => {
    try {
      await axios.post('/api/v1/ai/config/switch', { provider: p });
      setActiveProvider(p);
      fetchConfig();
    } catch (e: any) {
      alert('切换失败: ' + (e.response?.data?.message || e.message));
    }
  };

  const testLLM = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const res = await axios.post('/api/v1/ai/chat', {
        message: testPrompt,
        history: [],
      });
      setTestResult(res.data?.data?.response || '(空响应)');
    } catch (e: any) {
      setTestResult('❌ ' + (e?.response?.data?.message || e?.message));
    } finally {
      setTesting(false);
    }
  };

  const PROVIDER_INFO: Record<string, any> = {
    deepseek: { name: 'DeepSeek', icon: '🌑', color: '#111827' },
    gemini: { name: 'Gemini', icon: '✨', color: '#1a73e8' },
    openai: { name: 'ChatGPT', icon: '🧠', color: '#10a37f' },
    claude: { name: 'Claude', icon: '🐚', color: '#d97757' },
    ollama: { name: 'Ollama', icon: '🦙', color: '#000000' },
    mock: { name: 'Mock', icon: '⚡', color: '#64748b' },
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳ 加载配置中...</div>;

  return (
    <div>
      {/* Provider Selector Grid */}
      <div style={card}>
        {sectionTitle('模型提供商 (Multi-Provider)')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
          {Object.entries(llmConfig?.providers || {}).map(([id, info]: [string, any]) => {
            const p = PROVIDER_INFO[id] || { name: id, icon: '🤖', color: '#64748b' };
            const isActive = activeProvider === id;
            const isEditing = editProvider === id;
            return (
              <div key={id} onClick={() => handleProviderSelect(id)} style={{
                padding: '16px', borderRadius: '14px', border: '2px solid',
                borderColor: isEditing ? '#6366f1' : 'transparent',
                background: isActive ? '#f0fdf4' : '#f8fafc',
                cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{p.icon}</span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                   {isActive ? (
                     <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>● 活跃中</span>
                   ) : (
                     <button onClick={(e) => { e.stopPropagation(); switchActive(id); }} style={{
                       padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0',
                       background: 'white', fontSize: '10px', fontWeight: 700, color: '#64748b', cursor: 'pointer'
                     }}>切换至此</button>
                   )}
                   {!info.hasApiKey && id !== 'mock' && id !== 'ollama' && (
                     <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: 'auto' }}>⚠️ 未配置 Key</span>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Editor Column */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px' }}>{PROVIDER_INFO[editProvider]?.icon}</span>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{PROVIDER_INFO[editProvider]?.name} 配置</h3>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {editProvider !== 'mock' && (
              <>
                <div>
                  {label(editProvider === 'gemini' ? 'Gemini API Key (x-goog-api-key)' : 'API Key')}
                  <input type="password" style={inputStyle} value={form.apiKey}
                    onChange={e => setForm({ ...form, apiKey: e.target.value })} 
                    placeholder="不修改请留空 (sk-...)" />
                </div>
                <div>
                  {label('API Endpoint')}
                  <input style={inputStyle} value={form.endpoint}
                    onChange={e => setForm({ ...form, endpoint: e.target.value })} />
                </div>
              </>
            )}
            
            <div>
              {label('模型名称 (Model)')}
              <input style={inputStyle} value={form.model}
                onChange={e => setForm({ ...form, model: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                {label(`Temperature: ${form.temperature}`)}
                <input type="range" min="0" max="1" step="0.1" value={form.temperature}
                  onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} style={{ width: '100%' }} />
              </div>
              <div>
                {label('Max Tokens')}
                <input type="number" style={inputStyle} value={form.maxTokens}
                  onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => saveConfig(false)} style={{
                flex: 1, padding: '12px', background: '#0f172a', color: 'white',
                border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
              }}>💾 保存配置</button>
              <button onClick={() => saveConfig(true)} style={{
                flex: 1, padding: '12px', background: '#6366f1', color: 'white',
                border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
              }}>🚀 保存并启用</button>
            </div>
          </div>
        </div>

        {/* Test Column */}
        <div style={card}>
          {sectionTitle('实时接口测试 (模拟学生对话)')}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>测试 Prompt</span>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>活跃: {activeProvider}</span>
            </div>
            <textarea value={testPrompt} onChange={e => setTestPrompt(e.target.value)}
              style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          </div>
          
          {primaryBtn(testing ? '⏳ 等待回复...' : '▶ 发送对话请求', testLLM, testing)}

          {testResult && (
            <div style={{
              marginTop: '16px', padding: '16px', borderRadius: '12px',
              background: testResult.startsWith('❌') ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${testResult.startsWith('❌') ? '#fecaca' : '#e2e8f0'}`,
              fontSize: '13px', lineHeight: 1.6, color: '#334151',
              maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap'
            }}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ── 3. Image Panel (Image Generation) ─────────────────────────────────────────
function ImagePanel() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testPrompt, setTestPrompt] = useState('A vibrant university club recruitment poster, modern style, high quality');
  
  const [form, setForm] = useState({
    provider: 'openai',
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'dall-e-3',
  });

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/v1/ai/config');
      const data = res.data?.data;
      const openai = data?.providers?.['openai'];
      if (openai) {
        setForm({
          provider: 'openai',
          apiKey: '',
          endpoint: openai.endpoint || 'https://api.openai.com/v1',
          model: 'dall-e-3', // Default for image gen
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const saveConfig = async () => {
    try {
      await axios.put('/api/v1/ai/config', {
        provider: form.provider,
        apiKey: form.apiKey,
        endpoint: form.endpoint,
        model: form.model,
      });
      alert('图像配置已同步至 LLM 提供商 (当前复用 OpenAI 端点)');
    } catch (e: any) {
      alert('保存失败: ' + (e.response?.data?.message || e.message));
    }
  };

  const testImageGen = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const res = await axios.post('/api/v1/ai/generate-poster', {
        clubName: '测试社团',
        style: 'Modern Cyberpunk',
        description: testPrompt
      });
      setTestResult(res.data?.data?.url || '');
    } catch (e: any) {
      alert('生成失败: ' + (e.response?.data?.message || e.message));
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳ 加载中...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={card}>
        {sectionTitle('🖼️ 图像生成配置 (Image API)')}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            {label('服务提供商')}
            <select style={inputStyle} value={form.provider} onChange={e => setForm({...form, provider: e.target.value})}>
              <option value="openai">OpenAI (DALL-E 3)</option>
              <option value="midjourney" disabled>Midjourney (Soon)</option>
              <option value="flux" disabled>Flux (Soon)</option>
            </select>
          </div>
          <div>
            {label('API Key')}
            <input type="password" style={inputStyle} value={form.apiKey} 
              onChange={e => setForm({...form, apiKey: e.target.value})} placeholder="sk-..." />
          </div>
          <div>
            {label('接口地址 (Endpoint)')}
            <input style={inputStyle} value={form.endpoint} 
              onChange={e => setForm({...form, endpoint: e.target.value})} />
          </div>
          <div>
            {label('预配模型 (Model)')}
            <input style={inputStyle} value={form.model} 
              onChange={e => setForm({...form, model: e.target.value})} />
          </div>
          {primaryBtn('💾 保存图像接口配置', saveConfig)}
        </div>
      </div>

      <div style={card}>
        {sectionTitle('实时预览测试')}
        <div style={{ marginBottom: '16px' }}>
          {label('生成内容描述 (Prompt)')}
          <textarea value={testPrompt} onChange={e => setTestPrompt(e.target.value)} 
            style={{ ...inputStyle, height: '80px' }} />
        </div>
        {primaryBtn(testing ? '⏳ 正在绘图中...' : '🎨 立即生成测试海报', testImageGen, testing)}
        
        {testResult && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {label('生成结果预览')}
            <img src={testResult} alt="Poster Result" style={{ 
              width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }} />
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
              URL: {testResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. DB Admin Panel ────────────────────────────────────────────────────────
function DBAdminPanel() {
  const [activeTable, setActiveTable] = useState('application_flow');
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const tables = [
    { id: 'application_flow', label: '📋 申请记录' },
    { id: 'student_resume', label: '📄 简历库' },
    { id: 'recruitment_job', label: '💼 招新岗位' },
    { id: 'sys_user', label: '👤 用户账号' },
  ];

  const fetchData = async (table = activeTable, p = page) => {
    setLoading(true);
    try {
      const res = await axios.get(`${ENG_API}/db/${table}?page=${p}&size=15`);
      const d = res.data?.data;
      setData(d?.list || []);
      setTotal(d?.total || 0);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(activeTable, 1);
  }, [activeTable]);

  const handleDelete = async (id: number) => {
    if (!confirm(`确定删除 ID=${id} 的记录？此操作不可撤销。`)) return;
    setDeleting(id);
    try {
      await axios.delete(`${ENG_API}/db/${activeTable}/${id}`);
      fetchData();
    } catch (e: any) {
      alert('删除失败: ' + (e?.response?.data?.message || '权限不足 / 不支持'));
    } finally {
      setDeleting(null);
    }
  };

  const updateJobStatus = async (id: number, status: number) => {
    try {
      await axios.put(`${ENG_API}/db/recruitment_job/${id}/status`, { status });
      fetchData();
    } catch { alert('更新失败'); }
  };

  const columns = data.length > 0
    ? Object.keys(data[0]).filter(k => !['rawText', 'structuredData', 'publicityChannels', 'mainActivities'].includes(k))
    : [];

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      {/* Table selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tables.map(t => (
          <button key={t.id} onClick={() => setActiveTable(t.id)} style={{
            padding: '9px 18px', borderRadius: '10px', border: '1px solid',
            borderColor: activeTable === t.id ? '#6366f1' : '#e2e8f0',
            background: activeTable === t.id ? '#f5f3ff' : 'white',
            color: activeTable === t.id ? '#6366f1' : '#374151',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
          }}>{t.label}</button>
        ))}
        <button onClick={() => fetchData()} style={{
          padding: '9px 16px', borderRadius: '10px', border: '1px solid #e2e8f0',
          background: 'white', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        }}>🔄 刷新</button>
      </div>

      <div style={{ ...card, padding: '0', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{activeTable}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '10px' }}>共 {total} 条记录</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳ 加载中...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>暂无数据</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {columns.map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
                    {columns.map(col => (
                      <td key={col} style={{ padding: '10px 14px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[col] === null || row[col] === undefined ? (
                          <span style={{ color: '#d1d5db' }}>—</span>
                        ) : typeof row[col] === 'boolean' ? (
                          row[col] ? '✅' : '—'
                        ) : col === 'stage' ? (
                          <span style={{ padding: '2px 8px', borderRadius: '5px', background: '#f1f5f9', fontWeight: 700 }}>
                            {['审核中','面试中','已录取','未通过'][row[col]] || row[col]}
                          </span>
                        ) : String(row[col]).length > 40 ? (
                          <span title={String(row[col])}>{String(row[col]).slice(0, 40)}…</span>
                        ) : String(row[col])}
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {activeTable === 'recruitment_job' && (
                          <button onClick={() => updateJobStatus(row.id, row.status === 1 ? 0 : 1)} style={{
                            padding: '4px 10px', borderRadius: '6px',
                            background: row.status === 1 ? '#fef2f2' : '#f0fdf4',
                            color: row.status === 1 ? '#ef4444' : '#10b981',
                            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px',
                          }}>
                            {row.status === 1 ? '下线' : '上线'}
                          </button>
                        )}
                        {['application_flow', 'student_resume'].includes(activeTable) && (
                          <button onClick={() => handleDelete(row.id)} disabled={deleting === row.id} style={{
                            padding: '4px 10px', borderRadius: '6px', background: '#fef2f2',
                            color: '#ef4444', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '11px',
                            opacity: deleting === row.id ? 0.6 : 1,
                          }}>
                            {deleting === row.id ? '...' : '删除'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchData(activeTable, page - 1); }} style={{
              padding: '6px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600,
            }}>← 上一页</button>
            <span style={{ fontSize: '12px', color: '#64748b' }}>第 {page}/{totalPages} 页</span>
            <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); fetchData(activeTable, page + 1); }} style={{
              padding: '6px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600,
            }}>下一页 →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. System Status Panel ───────────────────────────────────────────────────
function StatusPanel() {
  const [checks, setChecks] = useState<Record<string, 'checking' | 'ok' | 'error'>>({});

  const services = [
    { key: 'backend', name: '后端 API (8080)', url: '/api/v1/engineering/db/tables' },
    { key: 'student', name: '学生端 (5174)', url: 'http://localhost:5174' },
    { key: 'club', name: '社团端 (5173)', url: 'http://localhost:5173' },
    { key: 'ollama', name: 'Ollama 本地模型', url: 'http://localhost:11434/api/tags' },
  ];

  const checkAll = async () => {
    const newChecks: Record<string, 'checking' | 'ok' | 'error'> = {};
    services.forEach(s => newChecks[s.key] = 'checking');
    setChecks({ ...newChecks });

    await Promise.all(services.map(async s => {
      try {
        await axios.get(s.url, { timeout: 2000 });
        newChecks[s.key] = 'ok';
      } catch { newChecks[s.key] = 'error'; }
      setChecks({ ...newChecks });
    }));
  };

  const algo_usages = [
    { algo: 'Cosine (All-MiniLM)', usage: '学生申请 → 计算匹配分（默认）\n推荐引擎 → 根据兴趣画像排序社团' },
    { algo: 'Jaccard', usage: '关键词搜索 → 快速标签重叠过滤\n轻量场景下的实时预筛选' },
    { algo: 'BM25', usage: '全文搜索 → 社团描述中关键词相关性排序\n候选人简历文本检索' },
    { algo: 'Gale-Shapley', usage: '批量稳定匹配 → 多社团同时录人时防止冲突\n当前作为偏好权重分输入（实验性）' },
  ];

  return (
    <div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          {sectionTitle('服务连通性检测')}
          {primaryBtn('🔍 全部检测', checkAll, false, true)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {services.map(s => {
            const st = checks[s.key];
            const [color, bg, text] = st === 'ok' ? ['#10b981', '#f0fdf4', '在线']
              : st === 'error' ? ['#ef4444', '#fef2f2', '离线']
              : st === 'checking' ? ['#f59e0b', '#fffbeb', '检测中...']
              : ['#94a3b8', '#f8fafc', '待检测'];
            return (
              <div key={s.key} style={{ padding: '14px', background: bg, borderRadius: '12px', border: `1px solid ${color}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{s.name}</span>
                </div>
                <p style={{ fontSize: '12px', color, fontWeight: 600, marginTop: '4px' }}>{text}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card}>
        {sectionTitle('算法使用逻辑说明')}
        <div style={{ display: 'grid', gap: '12px' }}>
          {algo_usages.map(a => (
            <div key={a.algo} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', padding: '14px', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#6366f1' }}>{a.algo}</div>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{a.usage}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────── Main Component ──────────
export function EngineeringPanel() {
  const [tab, setTab] = useState('algo');

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '72px auto 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>🔧 工程面板</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>算法调试 · LLM 接口管理 · 数据库 CRUD · 系统状态</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '28px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 22px', borderRadius: '10px', border: 'none',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? '#6366f1' : '#64748b',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            boxShadow: tab === t.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'algo' && <AlgorithmPanel />}
      {tab === 'llm' && <LLMPanel />}
      {tab === 'img' && <ImagePanel />}
      {tab === 'db' && <DBAdminPanel />}
      {tab === 'status' && <StatusPanel />}
    </div>
  );
}
