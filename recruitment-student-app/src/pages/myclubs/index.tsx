import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'

export default function MyClubs() {
  const [applications, setApplications] = useState<any[]>([])
  const userId = Taro.getStorageSync('userId')

  useDidShow(() => {
    fetchApplications()
  })

  const fetchApplications = async () => {
    if (!userId) return
    try {
      const res = await Taro.request({
        url: `http://localhost:8080/api/v1/recruitment/my-applications?userId=${userId}`
      })
      setApplications(res.data.data || [])
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  const getStatusLabel = (stage: number) => {
    switch(stage) {
      case 0: return { text: '已投递', class: 'pending' }
      case 1: return { text: '面试中', class: 'interview' }
      case 2: return { text: '已录取', class: 'success' }
      case 3: return { text: '未通过', class: 'fail' }
      default: return { text: '未知', class: '' }
    }
  }

  return (
    <ScrollView scrollY className='myclubs-container'>
      <View className='header'>
        <Text className='title'>我的申请</Text>
        <Text className='subtitle'>追踪你的社团加入进度</Text>
      </View>

      <View className='list-section'>
        {applications.length === 0 ? (
          <View className='empty-state'>
            <Text className='icon'>🔍</Text>
            <Text className='msg'>尚未投递任何社团</Text>
          </View>
        ) : (
          applications.map(app => {
            const status = getStatusLabel(app.stage)
            return (
              <View key={app.id} className='app-card'>
                <View className='card-top'>
                  <Text className='club-name'>{app.clubName}</Text>
                  <View className={`status-badge ${status.class}`}>{status.text}</View>
                </View>
                <Text className='job-title'>{app.jobTitle}</Text>
                
                <View className='card-footer'>
                  <View className='score-tag'>
                    <Text className='label'>AI 匹配分:</Text>
                    <Text className='value'>{app.matchScore}</Text>
                  </View>
                  <Text className='time'>{new Date(app.createTime).toLocaleDateString()}</Text>
                </View>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}
