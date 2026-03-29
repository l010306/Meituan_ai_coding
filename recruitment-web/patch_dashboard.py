import re

with open('src/pages/DashboardPage.tsx', 'r') as f:
    code = f.read()

# 1. Add states and function
state_old = "const [updatingId, setUpdatingId] = useState<number | null>(null);"
state_new = """const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewResults, setReviewResults] = useState<Record<number, any>>({});

  const handleReview = async (app: any) => {
    setReviewingId(app.id);
    try {
      const job = jobs.find(c => c.id === app.jobId);
      const res = await axios.post('http://localhost:8080/api/v1/ai/review-application', {
        jobTitle: app.jobTitle,
        jobDesc: job ? job.description : '',
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
  };"""
code = code.replace(state_old, state_new)

# 2. Add AI block in Modal
ui_old = """            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>个人介绍</h4>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                {selected.personalStatement || '未填写'}
              </p>
            </div>

            {/* Stage change buttons */}"""
ui_new = """            <div style={{ marginBottom: '24px' }}>
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

            {/* Stage change buttons */}"""
code = code.replace(ui_old, ui_new)

with open('src/pages/DashboardPage.tsx', 'w') as f:
    f.write(code)
print("Dashboard patch done")
