import { createStore } from 'vuex'
import { jobsList,buildHistory, jobDetails, queueItem,baseInfo,buildJob } from "@/api/jenkins"

const state = {
  config: {},
  baseInfo: {},
  jobs: [],
  buildHistorys: [],
  jobDetails: {},
  queueItem: {}
}

const getters = {}

const mutations = {
  configMuts(state:any, config:any) {
    state.config = config
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

  baseInfoAct(context: any) {
    return new Promise((resolve, reject) => {
      baseInfo(context.state.config).then(res => {
        if (!res) {
          reject('获取基本信息失败！')
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
        }
        resolve(res.data)
        context.commit('buildHistoryMuts', res.data)
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
        }
        resolve(res.data)
        context.commit('jobDetailsMuts', res.data)
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
        console.log(res, "--------------------------");
        resolve(res)
      }).catch(err => {
        reject(err)
      })
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
