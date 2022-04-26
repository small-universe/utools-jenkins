import axiosConfig  from "@/utils/axios"

const defaultConfig = {
    url: "http://localhost:8080",
    username: "admin",
    token: "11297aa19160468cc924da96c56ac755d5"
}

// const _axios = axiosConfig(defaultConfig);

export const baseInfo = (config: any) => {
    return axiosConfig(config).get("/api/json")
}

// export const getJenkinsCrumb = () => {
//     return axiosConfig(defaultConfig).get('/crumbIssuer/api/json').then(resp => {
//         console.log(resp.data);
//     },err => {
//         console.log(err);
//     })
// }

 /**
   * 获取任务列表
   * @param viewName
   * @returns {*}
   */
  export const jobsList = async (config:any, viewName: string) => {
    const resp: any = await axiosConfig(config).get((viewName ? "/view/" + viewName : "") + "/api/json")
    const res = resp.data
    
    for (let i = 0; i < res.jobs.length; i++) {
      let job = res.jobs[i]
      if (job._class === 'com.cloudbees.hudson.plugins.folder.Folder') {
        let jobs = await jobsListOfFolder(config,encodeURI(job.name))
        if (jobs && jobs.length !== 0) {
          res.jobs = res.jobs.concat(jobs)
        }
        res.data.jobs.splice(i, 1)
      }
    }
    return res
  }

  export const jobsListOfFolder = (config:any,folderPath:string) => {
    return axiosConfig(config).get('/job/' + folderPath + "/api/json").then((res:any) => {
      return res.data.jobs
    })
  }

    /**
   * 获取构建历史
   * @param jobName
   * @param buildNum
   * @returns {*|void}
   */
    export const buildHistory = (config:any, data:any) => {
        return axiosConfig(config).get("/job/" + data.jobName + "/" + data.buildNum + "/api/json")
    }

 /**
   * 获取任务详情
   * @param jobName
   * @returns {*} getJob
   */
  export const jobDetails = (config:any, jobName:string) => {
    return axiosConfig(config).get('/job/' + jobName + '/api/json')
  }

 /**
   * 获取队列信息
   * @param itemId
   */
    export const queueItem = (config:any,itemId:string) => {
        return axiosConfig(config).get('/queue/item/' + itemId + '/api/json')
    }
    

/**
* 构建任务
* @param jobName
* @param parameters
* @returns {*|void}
jobName:string, parameters: any
*/
export const buildJob = (config:any, data: any) => {
    let url
    if (data.parameters && data.parameters.length !== 0) {
        url = "/job/" + data.jobName + "/buildWithParameters"
    } else {
        url = "/job/" + data.jobName + "/build"
    }
    return axiosConfig(config).post(url, {}, { params: data.parameters })
}