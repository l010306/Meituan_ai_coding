import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Rocket, RotateCcw, ImageIcon, Download, Palette, Zap } from 'lucide-react';

const API = '/api/v1';

export function AiCreativePage() {
  const navigate = useNavigate();
  const [activeAiTab, setActiveAiTab] = useState<'copy' | 'visual'>('copy');
  
  // AI Copywriting State
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiHistory, setAiHistory] = useState<{id: number, text: string, time: string}[]>([]);

  // AI Poster State
  const [posterKeywords, setPosterKeywords] = useState('');
  const [posterGenerating, setPosterGenerating] = useState(false);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);

  useEffect(() => {
    const history = localStorage.getItem('club_ai_history');
    if (history) setAiHistory(JSON.parse(history));
  }, []);

  const handleAiGenerate = async () => {
    if (!aiKeywords) return alert('请输入创作意图');
    setAiGenerating(true);
    try {
      const res = await axios.post(`${API}/ai/generate-recruitment-ad`, {
        clubName: "社团",
        jobTitle: "招新岗位",
        keywords: aiKeywords
      });
      const text = res.data?.data;
      setAiResult(text);
      const newHistory = [{ id: Date.now(), text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...aiHistory.slice(0, 3)];
      setAiHistory(newHistory);
      localStorage.setItem('club_ai_history', JSON.stringify(newHistory));
    } catch (e) {
      alert("AI 生成失败，请检查网络或重试");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGeneratePoster = async () => {
    setPosterGenerating(true);
    try {
      const res = await axios.post(`${API}/ai/generate-poster`, {
        prompt: posterKeywords || "校园社团招新，活力四射",
        clubName: "社团",
        style: "minimalist"
      });
      setGeneratedPoster(res.data?.data);
    } catch (e) {
      alert("视觉生成失败");
    } finally {
      setPosterGenerating(false);
    }
  };

  const handleApplyToDescription = () => {
    if (!aiResult) return;
    localStorage.setItem('pending_club_description', aiResult);
    navigate('/employer');
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* 🚀 Compact Header & Tab Selector */}
        <div className="bg-slate-50/80 backdrop-blur-md rounded-3xl border border-slate-200 p-1.5 flex gap-1 shadow-sm">
          <button 
            onClick={() => setActiveAiTab('copy')}
            className={`flex-1 py-3 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest ${activeAiTab === 'copy' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <Sparkles className="w-4 h-4" /> 智能文案制作
          </button>
          <button 
            onClick={() => setActiveAiTab('visual')}
            className={`flex-1 py-3 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest ${activeAiTab === 'visual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <ImageIcon className="w-4 h-4" /> 视觉海报生成
          </button>
        </div>

        {/* 🎨 Main Workspace Area */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeAiTab === 'copy' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              
              {/* 📝 Left: Control Panel */}
              <div className="space-y-4 flex flex-col">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex-1">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                    <h4 className="text-slate-900 text-[11px] font-black uppercase tracking-widest">创作需求描述</h4>
                  </div>
                  <textarea 
                    value={aiKeywords} 
                    onChange={e => setAiKeywords(e.target.value)}
                    rows={8}
                    placeholder="请输入创作意图、社团特点或具体的招募要求..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm leading-relaxed resize-none h-[220px]"
                  />
                  
                  <button 
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-5 h-5" />}
                    {aiGenerating ? "正在解析..." : "立即生成创意文案"}
                  </button>
                </div>

                {/* 🕰️ Snapshots (Compact History) */}
                {aiHistory.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <h5 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">历史版本</h5>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {aiHistory.map(h => (
                        <div 
                          key={h.id} 
                          onClick={() => setAiResult(h.text)}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-white transition-all group overflow-hidden"
                        >
                          <div className="text-[9px] font-black text-indigo-400 mb-1 opacity-60">{h.time}</div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{h.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 📜 Right: Preview Panel */}
              <div className="bg-slate-900 rounded-[32px] p-8 relative flex flex-col min-h-[460px] shadow-xl group/output">
                <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">AI Rendering Result</span>
                  </div>
                  {aiResult && <div className="p-1 px-3 bg-indigo-600 rounded-full text-[9px] text-white font-black animate-pulse">Ready</div>}
                </div>

                {aiResult ? (
                  <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500 relative z-10">
                    <div className="flex-1 text-base text-slate-200 whitespace-pre-wrap leading-relaxed font-sans overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {aiResult}
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <button 
                        onClick={handleApplyToDescription}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        <Zap className="w-4 h-4 fill-white" /> 同步至社团招新表单
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="p-10 bg-white/5 rounded-full mb-6 italic text-white/5">
                      <Sparkles className="w-16 h-16 opacity-10" />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.5em] uppercase text-white/20">等待灵感注入</p>
                  </div>
                )}
                
                {/* Visual Risk Tip */}
                <div className="mt-4 py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                   <p className="text-[10px] text-white/30 text-center font-medium">⚠️ AI 生成文案请务必人工核对，确保信息的真实性与合规性。</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* 🎨 Left: Visual Style Control */}
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Palette className="w-4 h-4 text-violet-500" />
                    <h4 className="text-slate-900 text-[11px] font-black uppercase tracking-widest">视觉风格定制</h4>
                  </div>
                  <div className="relative">
                    <input 
                      value={posterKeywords} 
                      onChange={e => setPosterKeywords(e.target.value)}
                      placeholder="科技感、极简主义、插画风格、校园活力..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:bg-white transition-all text-sm font-bold pr-14"
                    />
                    <Palette className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                  </div>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                     <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">生成指引</h5>
                     <p className="text-xs text-slate-400 leading-relaxed font-medium">输入关键词后，后台扩散模型将基于您的社团详情产生专属视觉稿。⚠️ 视觉生成涉及深度计算，生成的背景图集仅供参考。</p>
                  </div>
                </div>

                <button 
                  onClick={handleGeneratePoster}
                  disabled={posterGenerating}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                >
                  {posterGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  {posterGenerating ? "AI 渲染中..." : "开启视觉生成实验室"}
                </button>
              </div>

              {/* 🖼️ Right: Poster Viewport */}
              <div className="relative group/poster bg-slate-100 rounded-[32px] border-4 border-white overflow-hidden flex flex-col items-center justify-center min-h-[500px] shadow-sm">
                {generatedPoster ? (
                  <div className="w-full h-full relative animate-in zoom-in duration-700">
                    <img src={generatedPoster} alt="Poster" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-6 bottom-6 p-6 bg-white/90 backdrop-blur-xl rounded-2xl flex justify-between items-center translate-y-[150%] group-hover/poster:translate-y-0 transition-all duration-500 shadow-xl border border-white">
                      <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Preview Ready</p>
                        <h4 className="text-slate-900 font-black text-lg tracking-tight italic">设计底稿 1.0</h4>
                      </div>
                      <button className="p-4 bg-slate-900 text-white rounded-xl hover:bg-black transition-all active:scale-90">
                        <Download size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 opacity-10 py-20 grayscale">
                    <Palette size={80} className="mx-auto" />
                    <p className="text-[10px] font-black tracking-[1em] uppercase -mr-[1em]">Canvas Idle</p>
                  </div>
                )}
                {posterGenerating && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6 animate-in fade-in">
                    <RotateCcw className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-indigo-600 text-[10px] font-black tracking-[0.8em] uppercase -mr-[0.8em]">Rendering</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
