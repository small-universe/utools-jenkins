import { createStore } from 'vuex'
import { 
  jobsList,
  buildHistory,
  jobDetails, 
  queueItem,
  baseInfo,
  buildJob,
  buildConsole,
  cancelBuild,
  cancelQueueItem,
  getJob,
  handleGitParameter } from "@/api/jenkins"

const state = {
  config: {},
  baseInfo: {},
  jobs: [],
  listLoading: false,
  buildHistorys: [],
  jobDetails: {},
  queueItem: {}
}

const getters = {
  jenkinsUrl: (state: any) => {
    return state.config.url
  },
  listLoading: (state: any) => {
    return state.listLoading
  }
}

const mutations = {
  configMuts(state:any, config:any) {
    state.config = config
  },

  listLoadingMuts(state: any, listLoading: false) {
    state.listLoading = listLoading
  },

  baseInfoMuts(state: any, { data }:{ data: any}) {
    state.baseInfo = data
  },

  jobsMuts(state:any, { data }:{data:any}) {
    state.jobs = data
  },

  buildHistoryMuts(state:any,{data}:{data:any}) {
    state.buildHistorys = data
  },

  jobDetailsMuts(state: any,{data}:{data:any}) {
    state.jobDetails = data;
  },

  queueItemMuts(state: any, {data}:{data:any}) {
    state.queueItem = data
  }
}

const actions = {
  configAct(context:any, config:any) {
    context.commit("configMuts", config)
  },

  listLoadingAct(context: any, listLoading: boolean) {
    context.commit("listLoadingMuts", listLoading)
  },

  baseInfoAct(context: any, config: any) {
    return new Promise((resolve, reject) => {
      baseInfo(config || context.state.config).then(res => {
        if (!res) {
          reject('获取基本信息失败！')
          return
        }
        resolve(res.data)
        context.commit('baseInfoMuts', res.data)
      }).catch(err => {
        reject(err)
      })
    })
  },

  jobsAct(context:any, viewName:string) {
    return new Promise(async (resolve,reject) => {
      const jobs = await jobsList(context.state.config,viewName)

      if(!jobs || jobs.length > 0) {
        reject("获取任务列表失败！")
        return
      }
      // for (let job of jobs.jobs) {
      //   job.lastBuildTime = 'N/A';
      //   utils.jobStatusToIcon(job)
      //   //this.getJobLastBuild(job)
      // }
      // console.log(jobs);
      
      resolve(jobs)
      context.commit("jobsMuts", jobs)
    })
  },
  buildHistoryAct(context: any, data: any) {
    return new Promise((resolve, reject) => {
      buildHistory(context.state.config, data).then(res => {
        if (!res) {
          reject('获取构建历史失败！')
          return
        }
        resolve(res)
        context.commit('buildHistoryMuts', res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  jobDetailsAct(context: any, jobName: string) {
    return new Promise((resolve, reject) => {
      jobDetails(context.state.config, jobName).then(res => {
        if (!res) {
          reject('获取任务详情失败！')
          return
        }
        resolve(res)
        context.commit('jobDetailsMuts', res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  queueItemAct(context: any, itemId: string) {
    return new Promise((resolve, reject) => {
      queueItem(context.state.config, itemId).then(res => {
        if (!res) {
          reject('获取任队列信息失败！')
          return
        }
        resolve(res.data)
        context.commit('queueItemMuts', res.data)
      }).catch(err => {
        reject(err)
      })
    })
  },
  buildJobAct(context: any, data: any) {
    return new Promise((resolve, reject) => {
      buildJob(context.state.config, data).then(res => {
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  buildConsoleAct(context: any, data: any) {
    return new Promise((resolve, reject) => {
      buildConsole(context.state.config, data).then(res => {
        if (!res) {
          reject('获取日志失败！')
          return
        }
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  cancelBuildAct(context: any, data: any) {
    return new Promise((resolve, reject) => {
      cancelBuild(context.state.config, data).then(res => {
        if (!res) {
          reject('取消构建失败！')
          return
        }
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  cancelQueueItemAct(context: any, itemId: string) {
    return new Promise((resolve, reject) => {
      cancelQueueItem(context.state.config, itemId).then(res => {
        if (!res) {
          reject('取消队列失败！')
          return
        }
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  getJobAct(context: any, jobName: string) {
    return new Promise((resolve, reject) => {
      getJob(context.state.config, jobName).then(res => {
        if (!res) {
          reject('获取任务失败！')
          return
        }
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  handleGitParameterAct(context: any, data: any) {
    return new Promise(async(resolve, reject) => {
      await handleGitParameter(context.state.config, data);
      resolve("成功")
    })
  }
}

export default createStore({
  state,
  getters,
  mutations,
  actions,
  modules: {}
})
