import axiosObj, { AxiosInstance } from 'axios'

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
          return conf
        },
        error => {
          return Promise.reject(error)
        },
  )

  _axios.interceptors.response.use(
      response => {
          // 只返回response中的data数据
          return response
        },
        error => {
          if (error) {
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