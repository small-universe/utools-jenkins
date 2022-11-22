import { createStore } from 'vuex'
import {
  listJobsOfView,
  buildHistory,
  jobDetails,
  queueItem,
  getBaseInfo,
  buildJob,
  buildConsole,
  cancelBuild,
  cancelQueueItem,
  getJob,
  handleGitParameter,
  listJobOfworkflow
} from "@/api/jenkins"
import { IJobListRequestParam } from '@/components/jenkins/model'
import { IGitPlatformAccount } from '@/components/repository/model'
import { getCurrentUser, listGitProject } from '@/api/gitlab'

const state = {
  config: {},
  baseInfo: {},
  jobs: [],
  workflowJobs: [],
  listLoading: false,
  buildHistorys: [],
  jobDetails: {},
  queueItem: {},
  currentView: {},
  gitAccount: {},
  gitProjectsLoading: false
}

const getters = {
  jenkinsUrl: (state: any) => {
    return state.config.url
  },
  listLoading: (state: any) => {
    return state.listLoading
  },
  gitAccount: (state: any) => {
    return state.gitAccount
  },
  gitProjectsLoading: (state: any) => {
    return state.gitProjectsLoading
  }
}

const mutations = {
  configMuts(state: any, config: any) {
    state.config = config
  },

  listLoadingMuts(state: any, listLoading: false) {
    state.listLoading = listLoading
  },

  baseInfoMuts(state: any, { data }: { data: any }) {
    state.baseInfo = data
  },

  jobsMuts(state: any, { data }: { data: any }) {
    state.jobs = data
  },

  buildHistoryMuts(state: any, { data }: { data: any }) {
    state.buildHistorys = data
  },

  jobDetailsMuts(state: any, { data }: { data: any }) {
    state.jobDetails = data;
  },

  queueItemMuts(state: any, { data }: { data: any }) {
    state.queueItem = data
  },

  gitAccountMuts(state: any, { data }: { data: any }) {
    state.gitAccount = data
  },
  gitProjectsMuts(state: any, { data }: { data: any }) {
    state.gitProjects = data
  },
  gitProjectsLoadingMuts(state: any, { data }: { data: any }) {
    state.gitProjectsLoding = data
  },
}

const actions = {
  configAct(context: any, config: any) {
    context.commit("configMuts", config)
  },

  listLoadingAct(context: any, listLoading: boolean) {
    context.commit("listLoadingMuts", listLoading)
  },

  baseInfoAct(context: any, config: any) {
    return new Promise((resolve, reject) => {
      getBaseInfo(config || context.state.config).then(res => {
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

  jobsAct(context: any, param: IJobListRequestParam) {
    return new Promise(async (resolve, reject) => {
      let jobs: any = []
      if (!!param.workflowName) {
        jobs = await listJobOfworkflow(context.state.config, param.workflowName)
      } else {
        jobs = await listJobsOfView(context.state.config, param.viewName)
      }

      if (!jobs || jobs.length > 0) {
        reject(`获取任务列表失败 param -> ${param}`)
        return
      }

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
    return new Promise(async (resolve, reject) => {
      await handleGitParameter(context.state.config, data);
      resolve("成功")
    })
  },
  gitAccountAct(context: any, loginReq: IGitPlatformAccount) {
    return new Promise(async (resolve, reject) => {
      const account = await getCurrentUser(loginReq.host, loginReq.token)
      if (!!account) {
        context.commit('gitAccountMuts', account)
        resolve({ status: 200, data: account })
      } else {
        resolve({ status: 400 })
      }
    })
  },
  gitProjectsAct(context: any, loginReq: IGitPlatformAccount) {
    return new Promise(async (resolve, reject) => {
      listGitProject({ ...loginReq }).then(res => {
        context.commit('gitProjectsMuts', res)
        resolve(res)
      }
      ).catch(err => {
        console.error(`[gitProjectsAct] ==> fail reason ==> ${err}`)
      })
    })
  },
  gitProjectsLoadingAct(context: any, gitProjectsLoading: boolean) {
    context.commit("gitProjectsLoadingMuts", gitProjectsLoading)
  },

}



export default createStore({
  state,
  getters,
  mutations,
  actions,
  modules: {}
})
