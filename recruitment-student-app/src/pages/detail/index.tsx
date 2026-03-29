import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

export default function ClubDetail() {
  const router = useRouter()
  const { id } = router.params
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.request({
      url: `http://localhost:8080/api/v1/recruitment/job/${id}`,
    }).then(res => {
      setJob(res.data.data)
      setLoading(false)
    }).catch(() => {
      Taro.showToast({ title: '加载社团信息失败', icon: 'none' })
      setLoading(false)
    })
  }, [id])

  const safeTagParse = (tags: any): string[] => {
    if (!tags) return []
    if (Array.isArray(tags)) return tags
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  const handleApply = () => {
    Taro.setStorageSync('applyingJob', job)
    Taro.navigateBack()
  }

  if (loading) return <View className='loading'>加载中...</View>
  if (!job) return <View className='error'>未找到该社团信息</View>

  return (
    <ScrollView scrollY className='detail-container'>
      {/* Hero Header */}
      <View className='hero-section'>
        <View className='glass-overlay'>
          <View className='club-identity'>
            <View className='club-logo-placeholder'>{job.clubName?.[0]}</View>
            <View className='text-group'>
              <Text className='club-name'>{job.clubName}</Text>
              <View className='badges'>
                <View className='badge category'>{job.category || '综合'}</View>
                <View className='badge level'>{job.orgLevel}</View>
                <View className='badge year'>Since {job.establishedYear}</View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Content Section */}
      <View className='content-card'>
        <View className='main-info'>
          <Text className='job-title'>{job.title}</Text>
          <View className='meta-grid'>
            <View className='meta-item'>
              <Text className='m-label'>招募名额</Text>
              <Text className='m-val'>{job.slots} 人</Text>
            </View>
            <View className='meta-item'>
              <Text className='m-label'>成员规模</Text>
              <Text className='m-val'>{job.memberSize}</Text>
            </View>
            <View className='meta-item'>
              <Text className='m-label'>活动频率</Text>
              <Text className='m-val'>{job.activityFrequency}</Text>
            </View>
          </View>
        </View>

        <View className='section'>
          <View className='s-title'>指导单位</View>
          <Text className='s-val'>{job.guidanceUnit}</Text>
        </View>

        <View className='section'>
          <View className='s-title'>社团简介</View>
          <Text className='s-val'>{job.description}</Text>
        </View>

        <View className='section'>
          <View className='s-title'>主要活动</View>
          <Text className='s-val'>{job.mainActivities}</Text>
        </View>

        <View className='section'>
          <View className='s-title'>品牌活动</View>
          <Text className='s-val'>{job.representativeActivities}</Text>
        </View>

        <View className='section'>
          <View className='s-title'>岗位要求</View>
          <View className='tags-container'>
            {safeTagParse(job.requirementTags).map(tag => (
              <View key={tag} className='tag-item'>{tag}</View>
            ))}
          </View>
        </View>

        <View className='section'>
          <View className='s-title'>宣传渠道</View>
          <Text className='s-val'>{job.publicityChannels}</Text>
        </View>

        <View className='bottom-spacer' />
      </View>

      {/* Floating Action Button */}
      <View className='footer-action'>
        <Button className='apply-btn' onClick={handleApply}>立即投递</Button>
      </View>
    </ScrollView>
  )
}
