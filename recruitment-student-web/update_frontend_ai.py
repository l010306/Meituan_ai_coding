import re

with open('src/pages/AIResume/index.tsx', 'r') as f:
    code = f.read()

# 1. Add fetching userProfile logic
old_handle_generate = """  const handleGenerate = async () => {
    if (!keywords.trim()) {
      alert("请输入关键词、兴趣或简短的经历描述");
      return;
    }
    setLoading(true)
    setSaved(false);
    try {
      const res = await fetch('http://localhost:8080/api/v1/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });"""

new_handle_generate = """  const handleGenerate = async () => {
    if (!keywords.trim()) {
      alert("请输入关键词、兴趣或简短的经历描述");
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      // 1. Fetch user profile first for synchronization
      const userId = localStorage.getItem('userId') || '1001';
      const profRes = await fetch(`http://localhost:8080/api/v1/recruitment/profile/${userId}`);
      const profData = await profRes.json();
      const userProfile = profData.data || {};

      // 2. Call AI with profile context
      const res = await fetch('http://localhost:8080/api/v1/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords,
          userProfile
        })
      });"""

code = code.replace(old_handle_generate.replace('\\n', '\n'), new_handle_generate.replace('\\n', '\n'))

with open('src/pages/AIResume/index.tsx', 'w') as f:
    f.write(code)
print("Frontend AI sync updated")
