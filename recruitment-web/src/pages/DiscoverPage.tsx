import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle, ArrowRight, Activity, Loader2, Sparkles } from 'lucide-react';

export function DiscoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  // Hardcode a mock job listing for this MVP stage
  const jobId = 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleApply = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Parse the PDF resume
      const parseResponse = await axios.post('/api/v1/recruitment/resume/parse', formData);
      
      if (parseResponse.data?.code !== 200) {
        alert("简历解析失败：" + parseResponse.data?.message);
        return;
      }

      const { id, structuredData } = parseResponse.data.data;
      setParsedData(structuredData);

      // Step 2: Automatically apply for the job with the parsed resume
      // Corrected param name to 'studentId' and using the 'id' from the response
      const applyResponse = await axios.post(`/api/v1/recruitment/apply/${jobId}?studentId=${id}`);
      
      if (applyResponse.data?.code === 200) {
        alert("投递成功！您的匹配得分为: " + applyResponse.data.data.matchScore);
      } else {
        alert("投递失败：" + applyResponse.data?.message);
      }

    } catch (error) {
      console.error(error);
      alert("投递过程出现网络错误。");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-24">
      <div className="text-center mb-16 px-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-6">
          发现适合你的社团
        </h1>
        <div className="flex justify-center mb-8">
          <Link 
            to="/dashboard/ai-resume"
            className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-slate-900 hover:scale-105 transition-all shadow-xl shadow-indigo-200"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 group-hover:animate-pulse" />
            ⚡ 开启 AI 简历助手
          </Link>
        </div>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          上传你的简历，我们将通过 LLM 智能提取核心技能，并为你精准匹配。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Job Card (Mocked for testing) */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              C
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">
              正在招新
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">校园音乐节主唱</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            我们正在寻找一位具有穿透力嗓音的主唱，加入我们的音乐社团，年末将在千人场馆登台演出！
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">声乐功底</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">舞台经验</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">摇滚乐</span>
          </div>
        </div>

        {/* Upload Resume Form */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            一键智能投递
          </h3>
          
          <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:bg-gray-50 hover:border-primary transition-all cursor-pointer group mb-6">
            {file ? (
              <div className="text-center p-6">
                <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-center p-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  拖拽上传 PDF 或 <span className="text-primary hover:underline">点击选择</span>
                </p>
                <p className="text-xs text-gray-400">仅支持 .pdf 格式</p>
              </div>
            )}
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
          </label>

          <button
            onClick={handleApply}
            disabled={!file || isUploading}
            className={`
              w-full flex justify-center items-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-md
              ${!file || isUploading 
                ? "bg-gray-300 shadow-none cursor-not-allowed" 
                : "bg-gray-900 hover:bg-black hover:shadow-xl hover:shadow-gray-900/20 active:scale-95"}
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                解析投递中...
              </>
            ) : (
              <>
                投递此岗位
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {parsedData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                <CheckCircle className="w-4 h-4" />
                AI 技能提取成功
              </div>
              <pre className="text-xs text-green-800 bg-green-100/50 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {parsedData}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
