import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Input, Textarea } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'

const CATEGORIES = [
  { name: '全部', icon: '🌟' },
  { name: '体育', icon: '⚽' },
  { name: '艺术', icon: '🎨' },
  { name: '技术', icon: '💻' },
  { name: '公益', icon: '💚' },
  { name: '学术', icon: '📚' },
  { name: '舞蹈', icon: '💃' },
  { name: '影视', icon: '🎬' },
]

type MainTab = 'keyword' | 'all'
type AppStep = 'discovery' | 'apply_form' | 'result'

export default function Index() {
  const [mainTab, setMainTab] = useState<MainTab>('keyword')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [jobList, setJobList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Application State
  const [appStep, setAppStep] = useState<AppStep>('discovery')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [formData, setFormData] = useState({ realName: '', contact: '', major: '', personalStatement: '' })
  const [matchResult, setMatchResult] = useState<any>(null)

  const userId = Taro.getStorageSync('userId')

  useEffect(() => {
    if (!userId) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [])

  // Check for return from Detail page with application intent
  useDidShow(() => {
    const jobToApply = Taro.getStorageSync('applyingJob')
    if (jobToApply) {
      setSelectedJob(jobToApply)
      setAppStep('apply_form')
      Taro.removeStorageSync('applyingJob')
    }
    fetchJobs()
  })

  useEffect(() => {
    fetchJobs()
  }, [mainTab, activeCategory])

  const fetchJobs = async (targetTab?: MainTab, targetCat?: string) => {
    const tab = targetTab || mainTab
    const cat = targetCat || activeCategory
    setLoading(true)
    try {
      let url = 'http://localhost:8080/api/v1/recruitment/jobs/all'
      if (tab === 'keyword') {
        url = `http://localhost:8080/api/v1/recruitment/jobs/search?category=${cat === '全部' ? '' : cat}&keyword=${searchKeyword}`
      }
      const res = await Taro.request({ url })
      setJobList(res.data.data || [])
    } catch (err) {
      console.error('Fetch Jobs Error:', err)
      Taro.showToast({ title: '网络连接失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const safeTagParse = (tags: any): string[] => {
    if (!tags) return []
    if (Array.isArray(tags)) return tags
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab)
    fetchJobs(tab)
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    fetchJobs(mainTab, cat)
  }

  const handleSearch = () => {
    fetchJobs()
  }

  const navigateToDetail = (jobId: number) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${jobId}` })
  }

  const handleFinalSubmit = async (withResume: boolean) => {
    if (!formData.realName || !formData.contact || !formData.major) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      Taro.showLoading({ title: withResume ? 'AI 正在解析...' : '正在提交...' })
      
      let resumeId: number

      if (withResume) {
        const fileRes = await Taro.chooseMessageFile({ count: 1, type: 'file', extension: ['.pdf'] })
        const uploadRes = await Taro.uploadFile({
          url: 'http://localhost:8080/api/v1/recruitment/resume/parse',
          filePath: fileRes.tempFiles[0].path,
          name: 'file',
          formData: {
            userId: String(userId),
            ...formData
          }
        })
        const resData = JSON.parse(uploadRes.data)
        if (resData.code !== 200) throw new Error(resData.message)
        resumeId = resData.data.id
      } else {
        const res = await Taro.request({
          url: 'http://localhost:8080/api/v1/recruitment/resume/submit-form',
          method: 'POST',
          header: { 'content-type': 'application/x-www-form-urlencoded' },
          data: {
            userId: String(userId),
            ...formData
          }
        })
        if (res.data.code !== 200) throw new Error(res.data.message)
        resumeId = res.data.data.id
      }

      Taro.showLoading({ title: '计算匹配度...' })
      const applyRes = await Taro.request({
        url: `http://localhost:8080/api/v1/recruitment/apply/${selectedJob.id}?studentId=${resumeId}`,
        method: 'POST'
      })

      if (applyRes.data.code !== 200) throw new Error(applyRes.data.message)

      Taro.hideLoading()
      setMatchResult(applyRes.data.data)
      setAppStep('result')
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView scrollY className='join-container'>
      {appStep === 'discovery' && (
        <View className='discovery-page'>
          {/* Header & Main Tabs */}
          <View className='header'>
            <Text className='greeting'>遇见你的精彩大学</Text>
            <View className='tab-switcher'>
              <View className={`tab-item ${mainTab === 'keyword' ? 'active' : ''}`} onClick={() => handleTabChange('keyword')}>
                关键词匹配
              </View>
              <View className={`tab-item ${mainTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>
                全部社团
              </View>
            </View>
          </View>

          {/* Keyword Match View */}
          {mainTab === 'keyword' && (
            <View className='search-view'>
              <Text className='search-title'>领域发现</Text>
              <ScrollView scrollX className='category-scroll'>
                {CATEGORIES.map(cat => (
                  <View 
                    key={cat.name} 
                    className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.name)}
                  >
                    <Text className='cat-icon'>{cat.icon}</Text>
                    <Text className='cat-name'>{cat.name}</Text>
                  </View>
                ))}
              </ScrollView>

              <View className='search-bar-wrap'>
                <Input 
                  className='search-input' 
                  placeholder='输入关键词（如：剪辑, 策划）' 
                  value={searchKeyword}
                  onInput={e => setSearchKeyword(e.detail.value)}
                />
                <Button className='search-btn' onClick={handleSearch}>搜索</Button>
              </View>
            </View>
          )}

          {/* All Clubs Filter Bar (Simplified) */}
          {mainTab === 'all' && (
            <View className='all-filter-view'>
              <Text className='result-count'>共找到 {jobList.length} 个招新岗位</Text>
            </View>
          )}

          {/* Result List */}
          <View className='result-list'>
            {loading ? (
              <View className='loading-state'>🔍 AI 匹配中...</View>
            ) : jobList.length === 0 ? (
              <View className='empty-state'>未找到匹配社团</View>
            ) : (
              jobList.map(job => (
                <View key={job.id} className='club-card' onClick={() => navigateToDetail(job.id)}>
                  <View className='card-header'>
                    <View className='club-tag'>{job.category || '综合'}</View>
                    <Text className='established'>Since {job.establishedYear}</Text>
                  </View>
                  <Text className='club-title'>{job.clubName}</Text>
                  <Text className='job-pos'>{job.title}</Text>
                  <View className='guidance-snippet'>📍 {job.guidanceUnit}</View>
                  <View className='tag-row'>
                    {safeTagParse(job.requirementTags).slice(0, 3).map(tag => (
                      <View key={tag} className='tag'>{tag}</View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Apply Form Overlay */}
      {appStep === 'apply_form' && (
        <View className='apply-page'>
          <View className='job-hint'>
            <Text className='h-label'>你正在申请</Text>
            <Text className='h-title'>{selectedJob?.clubName} · {selectedJob?.title}</Text>
          </View>

          <View className='form-card'>
            <View className='f-title'>完善个人信息</View>
            <View className='field'>
              <Text className='label'>真实姓名 *</Text>
              <Input className='input' value={formData.realName} onInput={e => setFormData({...formData, realName: e.detail.value})} />
            </View>
            <View className='field'>
              <Text className='label'>联系方式 *</Text>
              <Input className='input' value={formData.contact} onInput={e => setFormData({...formData, contact: e.detail.value})} />
            </View>
            <View className='field'>
              <Text className='label'>专业 *</Text>
              <Input className='input' value={formData.major} onInput={e => setFormData({...formData, major: e.detail.value})} />
            </View>
            <View className='field'>
              <Text className='label'>自我介绍 *</Text>
              <Textarea className='textarea' placeholder='简述你的经历（AI将根据此内容评分）' 
                value={formData.personalStatement} onInput={e => setFormData({...formData, personalStatement: e.detail.value})} />
            </View>
          </View>

          <View className='action-group'>
            <Button className='submit-primary' onClick={() => handleFinalSubmit(false)}>仅通过介绍投递</Button>
            <Button className='submit-secondary' onClick={() => handleFinalSubmit(true)}>上传 PDF 简历投递 (推荐)</Button>
            <Button className='submit-back' onClick={() => { setAppStep('discovery'); setSelectedJob(null); }}>返回</Button>
          </View>
        </View>
      )}

      {/* Result Page */}
      {appStep === 'result' && (
        <View className='result-page'>
          <View className='success-icon'>✅</View>
          <Text className='s-title'>投递已完成</Text>
          <Text className='s-sub'>你的申请正在审核中</Text>
          <View className='score-board'>
            <Text className='score-label'>AI 预估匹配分</Text>
            <Text className='score-val'>{matchResult?.matchScore || '--'}</Text>
          </View>
          <Button className='back-home' onClick={() => { setAppStep('discovery'); setSelectedJob(null); setMatchResult(null); }}>回到首页</Button>
        </View>
      )}
    </ScrollView>
  )
}
