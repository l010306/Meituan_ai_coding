import re

with open('src/pages/Discovery/index.tsx', 'r') as f:
    code = f.read()

# 1. Update form state
code = code.replace("  const [form, setForm] = useState({ realName: '', contact: '', major: '', statement: '' });", 
                    "  const [form, setForm] = useState({ realName: '', contact: '', major: '', statement: '', portfolioUrl: '' });")

# 2. Add file state
code = code.replace("const [submitting, setSubmitting] = useState(false);", 
                    "const [submitting, setSubmitting] = useState(false);\n  const [file, setFile] = useState<File | null>(null);")

# 3. Update handleApply logic to handle PDF vs Form-only
old_apply = """    const formData = new FormData();
    formData.append('userId', '1001');
    formData.append('realName', form.realName);
    formData.append('contact', form.contact);
    formData.append('major', form.major);
    formData.append('personalStatement', form.statement);
    if (structuredData) {
      formData.append('structuredData', structuredData);
    }

    try {
      const resp = await fetch('http://localhost:8080/api/v1/recruitment/resume/submit-form', {
        method: 'POST',
        body: formData
      });"""

new_apply = """    const formData = new FormData();
    formData.append('userId', localStorage.getItem('userId') || '1001');
    formData.append('realName', form.realName);
    formData.append('contact', form.contact);
    formData.append('major', form.major);
    formData.append('personalStatement', form.statement);
    formData.append('portfolioUrl', form.portfolioUrl);
    if (structuredData) {
      formData.append('structuredData', structuredData);
    }

    try {
      let endpoint = 'http://localhost:8080/api/v1/recruitment/resume/submit-form';
      if (file) {
        endpoint = 'http://localhost:8080/api/v1/recruitment/resume/parse';
        formData.append('file', file);
      }
      const resp = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });"""

code = code.replace(old_apply, new_apply)

# 4. Update UI: Add Portfolio and File upload
# Insert before the statement textarea
old_ui_insertion_point = """            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>"""

new_ui_fields = """            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>作品展示链接 (可选)</label>
              <input value={form.portfolioUrl} onChange={e => setForm({ ...form, portfolioUrl: e.target.value })}
                placeholder="https://github.com/yourname 或 个人网站"
                style={{ width: '100%', height: '42px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0 14px', color: 'white', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>附件简历 (PDF, 可选)</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ width: '100%', color: '#94a3b8', fontSize: '13px' }} />
            </div>

"""
code = code.replace(old_ui_insertion_point, new_ui_fields + old_ui_insertion_point)

with open('src/pages/Discovery/index.tsx', 'w') as f:
    f.write(code)
print("Discovery UI fields updated")
