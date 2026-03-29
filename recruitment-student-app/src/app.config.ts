export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/survey/index',
    'pages/detail/index',
    'pages/events/index',
    'pages/myclubs/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f7f9fc',
    navigationBarTitleText: 'SNU 智慧校招',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f7f9fc'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#111827',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '搜索社团'
      },
      {
        pagePath: 'pages/events/index',
        text: '活动广场'
      },
      {
        pagePath: 'pages/myclubs/index',
        text: '我的社团'
      }
    ]
  }
})
