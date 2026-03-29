import re

with open('src/pages/Discovery/index.tsx', 'r') as f:
    code = f.read()

# 1. Update handleGenerateResume to fetch and send profile
old_generate = """  const handleGenerateResume = async () => {
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
      });"""

new_generate = """  const handleGenerateResume = async () => {
    if (!form.statement.trim()) {
      alert("请先输入一些简单的关键词或草稿，AI会帮您润色成得体的自我介绍");
      return;
    }
    setGeneratingResume(true);
    try {
      const userId = localStorage.getItem('userId') || '1001';
      const profRes = await fetch(`http://localhost:8080/api/v1/recruitment/profile/${userId}`);
      const profData = await profRes.json();
      const userProfile = profData.data || {};

      const res = await fetch('http://localhost:8080/api/v1/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: form.statement,
          userProfile
        })
      });"""

code = code.replace(old_generate.replace('\\n', '\n'), new_generate.replace('\\n', '\n'))

with open('src/pages/Discovery/index.tsx', 'w') as f:
    f.write(code)
print("Discovery sync updated")
