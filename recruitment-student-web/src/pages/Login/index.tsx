import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

// Using inline SVGs to avoid dependency version issues
const Icons = {
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  ),
  Github: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
  ),
  ExternalLink: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
  ),
  Server: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6" y1="6" y2="6"/><line x1="6" x2="6" y1="18" y2="18"/></svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('stu20220002@campus.example.edu');
  const [password, setPassword] = useState('Stu@20221074');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/auth/sso-login', {
        email: email,
        password: password
      });
      if (res.data.code === 200) {
        localStorage.setItem('userId', res.data.data.id);
        localStorage.setItem('userName', res.data.data.schoolEmail.split('@')[0]);
        navigate('/dashboard/discovery');
      } else {
        alert(res.data.message || 'Login failed');
      }
    } catch (err) {
      alert('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Pane: Project Showcase */}
        <div className="project-showcase">
          <div className="status-badge">
            <Icons.Server /> 运行环境：Alibaba Cloud (HK)
          </div>
          
          <h1 className="project-title">AI-Native<br/>社团招新平台</h1>
          <p className="project-desc">
            基于 <strong>LLM + RAG</strong> 技术的智慧招新系统。整合了简历智能润色、多维兴趣匹配与 AI 招新文案生成，打造次世代的校园社团运营体验。
          </p>

          <div className="info-grid">
            <div className="info-item">
              <Icons.Zap />
              <div>
                <h5>学生端 (Student)</h5>
                <a href="http://47.242.249.27/" target="_blank" rel="noreferrer">
                  去申请 <Icons.ExternalLink />
                </a>
              </div>
            </div>
            <div className="info-item">
              <div style={{ color: '#fbbf24' }}><Icons.Zap /></div>
              <div>
                <h5>社团端 (Admin)</h5>
                <a href="http://47.242.249.27/admin/" target="_blank" rel="noreferrer">
                  去管理 <Icons.ExternalLink />
                </a>
              </div>
            </div>
          </div>

          <div className="test-key-box">
             <div className="key-header">
               <span style={{ color: '#f59e0b', marginRight: '6px' }}><Icons.Zap /></span> 测试弹药：DeepSeek API
             </div>
             <code className="key-string">sk-a938************************d2</code>
             <p className="key-tip">使用说明：请前往社团端「工程面板」填写此 Key 以激活 AI 服务</p>
          </div>

          <a href="https://github.com/l010306/Meituan_ai_coding" target="_blank" rel="noreferrer" className="github-link">
             <Icons.Github /> View Source on GitHub
          </a>
        </div>

        {/* Right Pane: Login Box */}
        <div className="login-card-area">
          <div className="glass-card login-box">
            <div className="login-header text-center">
               <div className="brand-icon">🎓</div>
               <h2>欢迎使用</h2>
               <p>由校园 SSO 身份认证系统驱动</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <div className="icon"><Icons.Mail /></div>
                <input 
                  type="text" 
                  placeholder="邮箱 (eg. stu20220002@...)" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <div className="icon"><Icons.Lock /></div>
                <input 
                  type="password" 
                  placeholder="初始密码" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary login-btn" disabled={loading}>
                {loading ? '正在验证...' : '进入社团世界'}
                {!loading && <Icons.ArrowRight />}
              </button>
            </form>

            <div className="login-footer">
              <div className="divider"><span>TEST USER</span></div>
              <p className="login-tip">测试账号已预填。如需新账号，首次登录将自动触发校库同步及静默注册。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
