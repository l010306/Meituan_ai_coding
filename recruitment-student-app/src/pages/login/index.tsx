import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Default suffix for school emails
  const schoolSuffix = '@snu.edu.cn';

  const handleLogin = async () => {
    if (!email || !password) {
      Taro.showToast({ title: '请输入邮箱前缀和密码', icon: 'none' });
      return;
    }

    setLoading(true);
    const fullEmail = email.includes('@') ? email : `${email}${schoolSuffix}`;

    try {
      // Connect to the local Spring Boot backend (running on 8080)
      // Note: for simulator localhost is fine, but for real phone testing this needs to be an IP
      const res = await Taro.request({
        url: 'http://localhost:8080/api/v1/auth/sso-login',
        method: 'POST',
        data: {
          email: fullEmail,
          password: password
        }
      });

      if (res.data.code === 200) {
        // Save the token and UserID into local storage
        Taro.setStorageSync('token', res.data.data.token);
        Taro.setStorageSync('userId', res.data.data.userId);

        Taro.showToast({ title: 'SSO 登录成功', icon: 'success' });

        // Navigate to the main application page
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/index/index' });
        }, 1000);
      } else {
        Taro.showToast({ title: res.data.message || '登录失败', icon: 'error' });
      }
    } catch (err) {
      Taro.showToast({ title: '网络连接失败，请检查服务器', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='login-container'>
      <View className='header'>
        <View className='logo-circle'>
          <Text className='logo-text'>S</Text>
        </View>
        <Text className='title'>高校统一身份认证</Text>
        <Text className='subtitle'>SNU Single Sign-On</Text>
      </View>

      <View className='form-group'>
        <View className='input-container'>
          <Text className='input-label'>学生校园邮箱</Text>
          <View className='input-wrapper'>
            <Input
              className='input'
              placeholder='学号/拼音 (无需加后缀)'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
            <Text className='suffix'>{schoolSuffix}</Text>
          </View>
        </View>

        <View className='input-container'>
          <Text className='input-label'>统一身份密码</Text>
          <Input
            className='input shadow-input'
            password
            placeholder='请输入学校统一认证密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button 
          className={`login-btn ${loading ? 'loading' : ''}`} 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '认证中...' : '授权登录'}
        </Button>
      </View>
      
      <View className='footer-text'>
        首次登录将自动与您的校园身份进行关联绑定
      </View>
    </View>
  )
}
