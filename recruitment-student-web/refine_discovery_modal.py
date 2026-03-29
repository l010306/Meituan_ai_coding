import re

with open('src/pages/Discovery/index.tsx', 'r') as f:
    code = f.read()

# 1. Add profile fetching effect when modal opens
old_effect = """  useEffect(() => {
    fetchJobs();
  }, []);"""

new_effect = """  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch profile to pre-fill when modal opens
  useEffect(() => {
    if (showApplyModal) {
      const fetchProfile = async () => {
        try {
          const userId = localStorage.getItem('userId') || '1001';
          const res = await fetch(`http://localhost:8080/api/v1/recruitment/profile/${userId}`);
          const data = await res.json();
          if (data.code === 200 && data.data) {
            setForm(prev => ({
              ...prev,
              realName: data.data.realName || prev.realName,
              contact: data.data.contact || prev.contact,
              major: data.data.major || prev.major
            }));
          }
        } catch (e) {
          console.error("Failed to pre-fill profile", e);
        }
      };
      fetchProfile();
    } else {
        // Reset form when modal closes if needed, or keep for convenience
    }
  }, [showApplyModal]);"""

code = code.replace(old_effect, new_effect)

# 2. Update AI Buttons UI (Remove icons and change labels)
# "载入已存AI简历" -> "载入AI简历"
code = code.replace('            <button onClick={loadSavedResume} style={{ background: \'transparent\', border: \'1px solid rgba(99, 102, 241, 0.4)\', color: \'#818cf8\', borderRadius: \'8px\', padding: \'6px 12px\', fontSize: \'12px\', cursor: \'pointer\', marginBottom: \'12px\', display: \'flex\', alignItems: \'center\', gap: \'4px\' }}>',
                    '            <button onClick={loadSavedResume} style={{ background: \'transparent\', border: \'1px solid rgba(99, 102, 241, 0.4)\', color: \'#818cf8\', borderRadius: \'8px\', padding: \'6px 12px\', fontSize: \'12px\', cursor: \'pointer\', marginBottom: \'12px\' }}>')
code = code.replace('<span>📥 载入已存 AI 简历</span>', '载入 AI 简历')

# "AI帮我写/润色" -> "一键润色"
code = code.replace('                  <button onClick={handleGenerateResume} disabled={generatingResume} style={{ background: \'transparent\', border: \'none\', color: \'#6366f1\', fontSize: \'12px\', cursor: \'pointer\', fontWeight: 600, display: \'flex\', alignItems: \'center\', gap: \'4px\' }}>',
                    '                  <button onClick={handleGenerateResume} disabled={generatingResume} style={{ background: \'transparent\', border: \'none\', color: \'#6366f1\', fontSize: \'12px\', cursor: \'pointer\', fontWeight: 600 }}>')
code = code.replace('<span>{generatingResume ? \'生成中...\' : \'✨ AI 帮我写 / 润色\'}</span>', "{generatingResume ? '生成中...' : '一键润色'}")

with open('src/pages/Discovery/index.tsx', 'w') as f:
    f.write(code)
print("Discovery modal refined")
