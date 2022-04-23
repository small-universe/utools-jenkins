import axiosConfig  from "@/utils/axios"

const defaultConfig = {
    url: "http://localhost:8080",
    username: "admin",
    password: "11297aa19160468cc924da96c56ac755d5"
}

const _axios = axiosConfig(defaultConfig);

export const getBaseInfo = () => {
    _axios.get("/api/json").then(resp => {
        console.log(resp.data);
    },err => {
        console.log(err);
    })
}

export const getJenkinsCrumb = () => {
    return _axios.get('/crumbIssuer/api/json').then(resp => {
        console.log(resp.data);
    },err => {
        console.log(err);
    })
}

/**
* 构建任务
* @param jobName
* @param parameters
* @returns {*|void}
*/
export const buildJob = (jobName:string, parameters: any) => {
 let url
 if (parameters && parameters.length !== 0) {
   url = "/job/" + jobName + "/buildWithParameters"
 } else {
   url = "/job/" + jobName + "/build"
 }
 _axios.post(url, {}, {
   params: parameters,
   headers: {
        "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8',
       "Jenkins-Crumb": "428288e95e42774e1d6580ec328fb0e2ef140acc15870fbc1048882e98943580"
   }
//    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
//    showLoading: true
 }).then(resp => {
    console.log(resp);
 }, err => {
    console.log(err);
 })
}