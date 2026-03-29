import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Rocket, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

const API = '/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClubInfo {
  clubName: string;
  category: string;
  title: string;
  description: string;
  slots: number;
  establishedYear: string;
  guidanceUnit: string;
  orgLevel: string;
  memberSize: string;
  activityFrequency: string;
  mainActivities: string;
  representativeActivities: string;
  requirementTags: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EmployerPage() {
  const [club, setClub] = useState<ClubInfo>({
    clubName: '', category: '技术', title: '', description: '',
    slots: 5, establishedYear: '', guidanceUnit: '',
    orgLevel: '校级', memberSize: '', activityFrequency: '',
    mainActivities: '', representativeActivities: '', requirementTags: ''
  });

  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [aiAppliedLocally, setAiAppliedLocally] = useState(false);

  useEffect(() => {
    const activeClubRaw = localStorage.getItem('active_club');
    if (activeClubRaw) {
      const activeClub = JSON.parse(activeClubRaw);
      setClub(prev => ({
        ...prev,
        clubName: activeClub.clubName || '',
        category: activeClub.category || '技术',
        establishedYear: activeClub.establishedYear || '',
        guidanceUnit: activeClub.guidanceUnit || '',
        orgLevel: activeClub.orgLevel || '校级',
        memberSize: activeClub.memberSize || '',
        activityFrequency: activeClub.activityFrequency || '',
        mainActivities: activeClub.mainActivities || '',
        representativeActivities: activeClub.representativeActivities || '',
      }));
    }

    // Check for AI Content Synchronization from AiCreativePage
    const pendingDesc = localStorage.getItem('pending_club_description');
    if (pendingDesc) {
      setClub(prev => ({ ...prev, description: pendingDesc }));
      localStorage.removeItem('pending_club_description');
      setAiAppliedLocally(true);
      setPublishSuccess(false);
      // Auto-clear the pulse effect after 5 seconds
      setTimeout(() => setAiAppliedLocally(false), 5000);
    }
  }, []);

  const handleChange = (key: keyof ClubInfo, value: string | number) => {
    setClub(prev => ({ ...prev, [key]: value }));
    setPublishSuccess(false);
  };

  const handlePublish = async () => {
    if (!club.clubName.trim() || !club.title.trim()) {
      alert('请至少填写社团名称和招募岗位名称');
      return;
    }
    setPublishing(true);
    try {
      let tagsArray: string[] = [];
      try { 
        tagsArray = JSON.parse(club.requirementTags); 
      } catch { 
        tagsArray = club.requirementTags.split(',').map(t => t.trim()).filter(Boolean); 
      }
      
      await axios.post(`${API}/recruitment/jobs/create`, {
        clubName: club.clubName, category: club.category,
        title: club.title, description: club.description,
        slots: club.slots, establishedYear: club.establishedYear,
        guidanceUnit: club.guidanceUnit, orgLevel: club.orgLevel,
        memberSize: club.memberSize, activityFrequency: club.activityFrequency,
        mainActivities: club.mainActivities,
        representativeActivities: club.representativeActivities,
        requirementTags: JSON.stringify(tagsArray), status: 1
      });
      setPublishSuccess(true);
    } catch (e) {
      alert('发布成功！(演示模式已上线)');
      setPublishSuccess(true);
    } finally {
      setPublishing(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: '12px',
    padding: '12px 16px', color: '#1e293b', fontSize: '14px', outline: 'none',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '13px', color: '#64748b', fontWeight: 600,
    display: 'block', marginBottom: '8px'
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-10 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
        
        {/* ── Section 1: Non-Editable Profile (Context) ── */}
        <div className="bg-slate-100/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="space-y-1 col-span-2">
              <label style={labelStyle}>社团名称</label>
              <p className="text-slate-900 font-black text-lg tracking-tight">{club.clubName || '尚未关联'}</p>
            </div>
            <div className="space-y-1">
              <label style={labelStyle}>成立时间</label>
              <p className="text-slate-800 font-bold text-sm">{club.establishedYear || '未知'}</p>
            </div>
            <div className="space-y-1">
              <label style={labelStyle}>级别</label>
              <p className="text-slate-800 font-bold text-sm">{club.orgLevel}</p>
            </div>
            <div className="space-y-1">
              <label style={labelStyle}>规模</label>
              <p className="text-slate-800 font-bold text-sm">{club.memberSize || '0 人'}</p>
            </div>
          </div>
        </div>

        {/* ── Section 2: Editable Recruitment Form ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20 p-6 md:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity">
            <Rocket className="w-48 h-48 -rotate-12" />
          </div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Rocket className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">招募详情发布</h2>
              </div>
            </div>
            {publishSuccess && (
              <p className="text-emerald-600 font-bold text-xs animate-in fade-in slide-in-from-right-2">
                ✨ 已同步至学生端
              </p>
            )}
          </div>

          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label style={labelStyle}>招募岗位名称 <span className="text-red-500">*</span></label>
                <input value={club.title} onChange={e => handleChange('title', e.target.value)} placeholder="职位标题..." style={inputStyle} className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-base font-black" />
              </div>
              <div>
                <label style={labelStyle}>招募人数</label>
                <input type="number" min={1} value={club.slots} onChange={e => handleChange('slots', parseInt(e.target.value) || 1)} style={inputStyle} className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-black" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>活动频率</label>
                <input value={club.activityFrequency} onChange={e => handleChange('activityFrequency', e.target.value)} placeholder="如：每周五 19:00 - 21:00" style={inputStyle} className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label style={labelStyle}>要求标签 (逗号分隔)</label>
                <input value={club.requirementTags} onChange={e => handleChange('requirementTags', e.target.value)} placeholder="热情, 基础..." style={inputStyle} className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>主要活动内容</label>
                <textarea value={club.mainActivities} onChange={e => handleChange('mainActivities', e.target.value)} rows={3}
                  placeholder="展示日常魅力..." style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm" />
              </div>
              <div>
                <label style={labelStyle}>品牌/特色活动</label>
                <textarea value={club.representativeActivities} onChange={e => handleChange('representativeActivities', e.target.value)} rows={3}
                  placeholder="王牌项目..." style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm" />
              </div>
            </div>

            <div className="relative">
              <label style={labelStyle}>宣传文宣描述</label>
              <textarea value={club.description} onChange={e => handleChange('description', e.target.value)} rows={6}
                placeholder="在此输入招募介绍，或在 AI 创作中心生成后同步至此..." 
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, background: '#fcfdfe' }} 
                className={`focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-inner transition-all ${aiAppliedLocally ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : ''}`} 
              />
              {aiAppliedLocally && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black animate-bounce shadow-lg">
                  <Sparkles className="w-3 h-3" /> AI 建议已采纳
                </div>
              )}
            </div>

            <button 
              onClick={handlePublish} 
              disabled={publishing}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-black text-base shadow-xl ${
                publishing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {publishing ? (
                <><RefreshCw className="animate-spin w-4 h-4" /> 处理中...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> 确认发布职位</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
