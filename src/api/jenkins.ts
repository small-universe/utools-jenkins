import axiosConfig  from "@/utils/axios"
import utils from "@/utils/toolsbox"

export const baseInfo = (config: any) => {
    return axiosConfig(config).get("/api/json")
}

 /**
   * 获取任务列表
   * @param viewName
   * @returns {*}
   */
export const jobsList = async (config:any, viewName: string) => {
    try {
        const resp: any = await axiosConfig(config).get((viewName ? "/view/" + viewName : "") + "/api/json")
        console.log(resp, "==========================")
        const res = resp.data
    
        if(!res.jobs) {
            return null
        }
    
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
    } catch(err) {
        console.log(err, "err-----------------------------------");
        
        return null
    }
    
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
    if (data.parameters && utils.checkNullObj(data.parameters)) {
        url = "/job/" + data.jobName + "/buildWithParameters"
    } else {
        url = "/job/" + data.jobName + "/build"
    }
    return axiosConfig(config).post(url, {}, { params: data.parameters })
}

/**
  * 获取控制台日志
  * @param jobName
  * @param number
  * @param start
  * @returns {*}
  */
export const buildConsole = (config:any, data: any) => {
    if (!data.start) {
        data.start = 0
    }
    return axiosConfig(config).get('/job/' + data.jobName + '/' + data.number + '/logText/progressiveHtml', {
        params: {start: data.start}
    })
}

  /**
   * 取消构建
   * @param jobName
   * @param num
   * @returns {*|void}
   */
export const cancelBuild = (config:any, data: any) => {
    return axiosConfig(config).post("/job/" + data.jobName + "/" + data.num + "/stop")
}

/**
 * 取消队列任务
 * @param itemId
 * @returns {*|void}
 */
export const cancelQueueItem = (config:any, itemId:string) => {
    return axiosConfig(config).post('/queue/cancelItem', {}, {
        params: {id: itemId}
    })
}

  /**
   * 获取任务详情
   * @param jobName
   * @returns {*}
   */
export const getJob = (config:any, jobName: string) => {
    return axiosConfig(config).get('/job/' + jobName + '/api/json')
}

/**
   * 获取git参数
   * @param jobName
   * @param paramName
   * @returns {*|void}
   */
 const getBuildGitParameter = (config:any, data: any) => {
    let headers = {}
    return axiosConfig(config).post("/job/" + data.jobName + '/descriptorByName/net.uaznia.lukanus.hudson.plugins.gitparameter.GitParameterDefinition/fillValueItems?param=' + data.paramName, {}, {
      headers: headers
    })
  }

  /**
   * 处理git参数
   * @param job
   * @param param
   * @returns {Promise<void>}
   */
  export const handleGitParameter = async (config:any, data: any) => {
    if (data.param._class === 'net.uaznia.lukanus.hudson.plugins.gitparameter.GitParameterDefinition') {
      let result = await getBuildGitParameter(data.job.name, data.param.name).then(res => res.data);
      console.log('git parameter', result)
      let choices = []
      let options = result ? result.values : []
      if (options.length !== 0) {
        for (let i = 0; i < options.length; i++) {
          choices.push({text: options[i].name, value: options[i].value})
        }
      }
      data.param.choices = choices
    }
  }