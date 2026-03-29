import { useState } from 'react'
import { View, Text, Button, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const INTEREST_OPTIONS = [
  { key: '音乐', emoji: '🎵' }, { key: '摄影', emoji: '📷' },
  { key: '编程', emoji: '💻' }, { key: '创业', emoji: '🚀' },
  { key: '公益', emoji: '💚' }, { key: '学术', emoji: '📚' },
  { key: '体育', emoji: '⚽' }, { key: '设计', emoji: '🎨' },
  { key: '影视', emoji: '🎬' }, { key: '文学', emoji: '✍️' },
]

const PERSONALITY_TYPES = [
  { key: 'DILIGENT_LEARNER', label: '深耕型学习者', desc: '我喜欢在一个领域持续深入，追求专业精通' },
  { key: 'DISCERNING_ACHIEVER', label: '高效成就者', desc: '我目标明确，倾向高性价比的参与和产出' },
  { key: 'EXPLORER', label: '广泛探索者', desc: '我对一切充满好奇，喜欢尝试各种不同领域' },
  { key: 'SOCIAL_CONNECTOR', label: '社交连接者', desc: '我在人际互动中找到价值，擅长协调与沟通' },
]

export default function Survey() {
  const [step, setStep] = useState(0) // 0: interests, 1: time, 2: personality
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [weeklyHours, setWeeklyHours] = useState(5)
  const [commitmentLevel, setCommitmentLevel] = useState<'LOW' | 'MED' | 'HIGH'>('MED')
  const [personalityType, setPersonalityType] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleInterest = (key: string) => {
    setSelectedInterests(prev =>
      prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
    )
  }

  const handleSubmit = async () => {
    if (!personalityType) {
      Taro.showToast({ title: '请选择你的性格特征', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const userId = Taro.getStorageSync('userId')
      const res = await Taro.request({
        url: 'http://localhost:8080/api/v1/recommendation/profile',
        method: 'POST',
        data: {
          userId,
          interestTags: JSON.stringify(selectedInterests),
          weeklyFreeHours: weeklyHours,
          commitmentLevel,
          personalityType
        }
      })
      if (res.data.code === 200) {
        Taro.setStorageSync('profileComplete', true)
        Taro.showToast({ title: '画像已生成！', icon: 'success' })
        setTimeout(() => Taro.reLaunch({ url: '/pages/index/index' }), 1000)
      }
    } catch {
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='survey-container'>
      {/* Progress bar */}
      <View className='progress-bar'>
        <View className='progress-fill' style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </View>

      {/* Step 0: Interest Tags */}
      {step === 0 && (
        <View className='step'>
          <Text className='question'>你最感兴趣的领域是？</Text>
          <Text className='question-sub'>可多选，选 2-4 个最能代表你的方向</Text>
          <View className='interest-grid'>
            {INTEREST_OPTIONS.map(opt => (
              <View
                key={opt.key}
                className={`interest-chip ${selectedInterests.includes(opt.key) ? 'selected' : ''}`}
                onClick={() => toggleInterest(opt.key)}
              >
                <Text className='chip-emoji'>{opt.emoji}</Text>
                <Text className='chip-label'>{opt.key}</Text>
              </View>
            ))}
          </View>
          <Button
            className='next-btn'
            disabled={selectedInterests.length < 1}
            onClick={() => setStep(1)}
          >
            下一步 ({selectedInterests.length} 项已选)
          </Button>
        </View>
      )}

      {/* Step 1: Time & Commitment */}
      {step === 1 && (
        <View className='step'>
          <Text className='question'>你每周有多少时间投入社团？</Text>
          <Text className='question-sub'>拖动滑块选择大致的空闲时间</Text>
          <View className='slider-section'>
            <Text className='slider-value'>{weeklyHours} 小时 / 周</Text>
            <Slider
              min={1} max={20} step={1} value={weeklyHours}
              activeColor='#111827'
              onChange={e => setWeeklyHours(e.detail.value)}
            />
            <View className='slider-labels'>
              <Text>轻度 1h</Text>
              <Text>中度 10h</Text>
              <Text>重度 20h</Text>
            </View>
          </View>

          <Text className='sub-question'>期望的参与深度？</Text>
          <View className='commitment-options'>
            {[
              { key: 'LOW', label: '轻量', desc: '体验为主，灵活参与' },
              { key: 'MED', label: '均衡', desc: '认真但不干扰学业' },
              { key: 'HIGH', label: '深度', desc: '全力投入，追求成果' },
            ].map(opt => (
              <View
                key={opt.key}
                className={`commitment-card ${commitmentLevel === opt.key ? 'selected' : ''}`}
                onClick={() => setCommitmentLevel(opt.key as any)}
              >
                <Text className='clabel'>{opt.label}</Text>
                <Text className='cdesc'>{opt.desc}</Text>
              </View>
            ))}
          </View>
          <View className='btn-row'>
            <Button className='back-btn' onClick={() => setStep(0)}>← 返回</Button>
            <Button className='next-btn flex1' onClick={() => setStep(2)}>下一步 →</Button>
          </View>
        </View>
      )}

      {/* Step 2: Personality */}
      {step === 2 && (
        <View className='step'>
          <Text className='question'>最像你的是哪一种特质？</Text>
          <Text className='question-sub'>这将影响 AI 为你推荐的社团类型</Text>
          <View className='personality-list'>
            {PERSONALITY_TYPES.map(pt => (
              <View
                key={pt.key}
                className={`personality-card ${personalityType === pt.key ? 'selected' : ''}`}
                onClick={() => setPersonalityType(pt.key)}
              >
                <Text className='plabel'>{pt.label}</Text>
                <Text className='pdesc'>{pt.desc}</Text>
              </View>
            ))}
          </View>
          <View className='btn-row'>
            <Button className='back-btn' onClick={() => setStep(1)}>← 返回</Button>
            <Button className='next-btn flex1' onClick={handleSubmit} disabled={submitting}>
              {submitting ? '生成画像中...' : '生成我的专属推荐 ✨'}
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
