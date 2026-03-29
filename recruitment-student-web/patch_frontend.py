import re

with open('src/pages/Discovery/index.tsx', 'r') as f:
    code = f.read()

# 1. Add states
state_old = "const [submitting, setSubmitting] = useState(false);"
state_new = """const [submitting, setSubmitting] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [structuredData, setStructuredData] = useState<string | null>(null);

  const handleGenerateResume = async () => {
    if (!form.statement.trim()) {
      alert("请先输入一些简单的关键词或草稿，AI会帮您润色成得体的自我介绍");
      return;
    }
    setGeneratingResume(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: form.statement })
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
  };"""
code = code.replace(state_old, state_new)

# 2. Update handleApply
apply_old = """    const formData = new FormData();
    formData.append('userId', '1001');
    formData.append('realName', form.realName);
    formData.append('contact', form.contact);
    formData.append('major', form.major);
    formData.append('personalStatement', form.statement);

    try {"""
apply_new = """    const formData = new FormData();
    formData.append('userId', '1001');
    formData.append('realName', form.realName);
    formData.append('contact', form.contact);
    formData.append('major', form.major);
    formData.append('personalStatement', form.statement);
    if (structuredData) {
      formData.append('structuredData', structuredData);
    }

    try {"""
code = code.replace(apply_old, apply_new)

# 3. Update the UI
ui_old = """            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>自我介绍 *</label>
              <textarea value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })}"""
ui_new = """            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>自我介绍 *</label>
                <button onClick={handleGenerateResume} disabled={generatingResume} style={{
                  background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
                  color: 'hsl(220,95%,65%)', borderRadius: '6px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  opacity: generatingResume ? 0.6 : 1
                }}>
                  {generatingResume ? '⏳ 正在生成中...' : '�� AI 帮我写 / 润色'}
                </button>
              </div>
              <textarea value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })}"""
code = code.replace(ui_old, ui_new)

with open('src/pages/Discovery/index.tsx', 'w') as f:
    f.write(code)
print("Discovery integration done")
