import axiosObj, { AxiosInstance, AxiosRequestConfig } from 'axios'

/**
 * 请求失败后的错误统一处理，当然还有更多状态码判断，根据自己业务需求去扩展即可
 * @param status 请求失败的状态码
 * @param msg 错误信息
 */
 const errorHandle = (status: number, msg: string) => {
    // 状态码判断
    switch (status) {
      // 401: 未登录状态，跳转登录页
      case 401:
        // 跳转登录页
        break
      // 403 token过期
      case 403:
        // 如果不需要自动刷新token，可以在这里移除本地存储中的token，跳转登录页
  
        break
      // 404请求不存在
      case 404:
        // 提示资源不存在
        break
      default:
      // console.log(msg)
    }
  }

const createAxios = (config: any) => {
    const _axios: AxiosInstance = axiosObj.create({
        baseURL: config.url,
        auth: {
            username: config.username,
            password: config.token
        }
    })
    return _axios
}

// 暴露安装方法
const axiosConfig = (config: any) => {
  // 创建实例
  const _axios:AxiosInstance = createAxios(config)
  // 请求拦截器
  _axios.interceptors.request.use(
      conf => {
          //const token = '5b6deea38acf451f88519660f36fea58'
          // 从vuex里获取token
          // const token = store.state.token
          // 如果token存在就在请求头里添加
          //if (token) {
          //  conf.headers!.token = token
          //}
          return conf
        },
        error => {
          // Do something with request error
          error.data = {}
          error.data.msg = '服务器异常'
          return Promise.reject(error)
        },
  )

  _axios.interceptors.response.use(
      response => {
          // 清除本地存储中的token,如果需要刷新token，在这里通过旧的token跟服务器换新token，将新的token设置的vuex中
          if (response.data.code === 401) {
            localStorage.removeItem('token')
            // 页面刷新
            parent.location.reload()
          }
          // 只返回response中的data数据
          return response
        },
        error => {
          if (error) {
            // 请求已发出，但不在2xx范围内
            errorHandle(error.response.status, error.response.data.message)
            return Promise.reject(error)
          } else {
            // 断网
            return Promise.reject(error)
          }
        },
  )

  return _axios
}


export default axiosConfig;