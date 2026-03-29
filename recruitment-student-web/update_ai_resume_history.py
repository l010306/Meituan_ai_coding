import re

with open('src/pages/AIResume/index.tsx', 'r') as f:
    code = f.read()

# 1. Add history state and useEffect
old_states = """  const [result, setResult] = useState<{ statement: string; structuredData: any } | null>(null);
  const [saved, setSaved] = useState(false);"""

new_states = """  const [result, setResult] = useState<{ statement: string; structuredData: any } | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  React.useEffect(() => {
    const h = localStorage.getItem('ai_resume_history');
    if (h) setHistory(JSON.parse(h));
  }, []);"""

code = code.replace(old_states, new_states)

# 2. Update handleGenerate to save to history
old_generate_end = """        setResult(data.data.data);
      } else {"""

new_generate_end = """        setResult(data.data.data);
        const newRecord = { 
          id: Date.now(), 
          timestamp: new Date().toLocaleString(),
          ...data.data.data 
        };
        const newHistory = [newRecord, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('ai_resume_history', JSON.stringify(newHistory));
      } else {"""

code = code.replace(old_generate_end, new_generate_end)

# 3. Add History UI component
history_ui = """        {/* History Area */}
        <section className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', gridColumn: result ? '1/-1' : 'auto' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>最近生成记录</h3>
          {history.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '13px' }}>暂无记录</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {history.map(h => (
                <div key={h.id} onClick={() => setResult(h)} style={{ 
                  padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', cursor: 'pointer',
                  border: result?.id === h.id ? '1px solid #6366f1' : '1px solid transparent', transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 700, marginBottom: '4px' }}>{h.timestamp}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.statement.substring(0, 30)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>"""

# Find the end of the results area or the main div
code = code.replace('      </div>\n    </div>', history_ui + '\n      </div>\n    </div>')

with open('src/pages/AIResume/index.tsx', 'w') as f:
    f.write(code)
print("AI Resume History updated")
