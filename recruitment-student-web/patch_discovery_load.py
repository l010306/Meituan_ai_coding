import re

with open('src/pages/Discovery/index.tsx', 'r') as f:
    code = f.read()

# 1. Add load helper
helper_old = "  const handleGenerateResume = async () => {"
helper_new = """  const handleLoadSavedResume = () => {
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

  const handleGenerateResume = async () => {"""
code = code.replace(helper_old, helper_new)

# 2. Add Button to UI
ui_old = """                <button onClick={handleGenerateResume} disabled={generatingResume} style={{"""
ui_new = """                <button onClick={handleLoadSavedResume} style={{
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', borderRadius: '6px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  marginRight: '8px'
                }}>
                  📥 载入已存 AI 简历
                </button>
                <button onClick={handleGenerateResume} disabled={generatingResume} style={{"""
code = code.replace(ui_old, ui_new)

with open('src/pages/Discovery/index.tsx', 'w') as f:
    f.write(code)
print("Discovery load patch done")
