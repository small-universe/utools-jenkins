<script lang="ts">
import { NButton, NIcon,NTime,SelectOption, useMessage, useDialog } from "naive-ui";
import { Construct as ConstructIcon, CloseCircleOutline } from "@vicons/ionicons5";
import { ChangeCatalog } from "@vicons/carbon";
import { h, defineComponent, ref, computed } from "vue";
import { useStore } from 'vuex'
import utils from "@/utils/toolsbox";
import StatusIcon from "@/components/StatusIcon.vue"

const utools = window.utools

const createColumns = (
  { buildJob }: { buildJob: (row: any, index: number) => void },
  { cancelBuildJob }: { cancelBuildJob: (row: any) => void },
  { viewLog }: { viewLog: (row: any) => void }
) => {
  return [
    {
      title: "状态",

      width: 70,
      fixed: "left",
      render(row: any) {
          return h(StatusIcon, {
              name: row.icon,
              color: row.color,
              anime: row.anime
          })
      }
    },
    {
      title: "名称",
      key: "name",
      width: 180,
      fixed: "left",
    },
    {
      title: "构建时间",
      key: "lastBuildTime",
      width: 180,
      render (row: any) {
        if(!(row.lastBuildTime) || row.lastBuildTime === "N/A") {
            return h('span', ["N/A"])
        } else {
            return h(NTime, {
                time: row.lastBuildTime,
                format: 'yyyy-MM-dd hh:mm:ss'
            })
        }
      }
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render(row: any, index: number) {
          const ops = [];
          if(row.buildStatus && row.buildStatus !== 'FINISH') {
              ops[0] = h(
                    NButton,
                    {
                    strong: true,
                    secondary: true,
                    circle: true,
                    type: "success",
                    title: "取消",
                    onClick: () => cancelBuildJob(row),
                    },
                    {
                    icon: () =>
                        h(NIcon, {
                        component: CloseCircleOutline,
                        }),
                    }
                )
          } else {
            ops[0] = h(
                NButton,
                {
                strong: true,
                secondary: true,
                circle: true,
                type: "success",
                title: "构建",
                onClick: () => buildJob(row, index),
                },
                {
                icon: () =>
                    h(NIcon, {
                    component: ConstructIcon,
                    }),
                }
            )
            
          }
          ops[1] = h(
                NButton,
                {
                strong: true,
                secondary: true,
                circle: true,
                type: "success",
                title: "查看日志",
                style: {
                    marginLeft: "10px",
                },
                onClick: () => viewLog(row),
                },
                {
                icon: () =>
                    h(NIcon, {
                    component: ChangeCatalog,
                    }),
                }
            )
          return ops;
      },
    },
  ];
};

const jenkinsList = () => {
    const list = utils.getConfigList()
    let jks:any[] = []
    list.forEach((item) => {
        jks.push({
            label: item.data.name,
            value: item._id,
            data: item.data
        })
    })
    return jks
}

export default defineComponent({
  name: "Jenkins",
  components: { StatusIcon },
  setup() {
    const store = useStore()
    const message = useMessage()
    const dialog = useDialog()
    const configList = ref<any>(jenkinsList());
    const jkName = ref(configList?.value[0]?.value || null)
    const jobs = ref<any>([{}])
    const jobName = ref("")
    const viewNames = ref<any>([{}])
    const viewName = ref("all")
    
    
    store.dispatch("configAct",configList?.value[0]?.data)

    const buildJob = (rowData: any, index: number) => {
        console.log("构建-----------------");
        dialog.info({
            title: "温馨提示",
            content: "您是否构建，" + rowData.name + "任务？",
            positiveText: "开始构建",
            showIcon: false,
            onPositiveClick: () => {
                store.dispatch("buildJobAct", { jobName: rowData.name }).then((res) => {
                    const job = jobs.value[index]
                    let location = res.headers.location
                    let regExp = new RegExp('^.*/item/([a-zA-Z0-9]+)/$')
                    let array = regExp.exec(location);
                    if (array!.length >= 2) {
                        job.curBuildingQueueItemId = array![1]
                    }
                    if (job.curBuildingNumber) {
                        delete job.curBuildingNumber
                    }
                    job['buildStatus'] = 'SUBMIT'
                    timingGetBuildProgress(job)
                    message.success("开始构建")
                }).catch(err => {
                    console.log(err);
                })
            }
        })
    };

    const cancelBuildJob = (rowData: any) => {
        console.log("取消---------------------------");
    }

    const viewLog = (rowData: any) => {
      console.log("查看日志-------------------");
    };

    const setProgress = (job:any) => {
      let row = document.querySelectorAll('.el-table__fixed .el-table__row > td:nth-child(2)').item(job.index);
      if (job.buildStatus === 'FINISH') {
        row.removeAttribute('style')
      } else {
        row.setAttribute('style', 'background: linear-gradient(to right, #D9ECFF ' + job.progress + '%,#ffffff 0%)')
      }
    }

    /**
     * 获取构建进度
     * @param job
     */
    const getBuildProgress = async (job: any) => {
      if (job.curBuildingNumber) {
          const params = {
            jobName:job.name,
            buildNum:job.curBuildingNumber
          }
          store.dispatch("buildHistoryAct",params).then(res => {
          let result = res
          if (result.building === false && result.result) {
            job['buildStatus'] = 'FINISH'
            job['buildResult'] =result.result
            job['anime'] = false
            setProgress(job)
          } else {
            let startTime = result.timestamp
            let nowTime = new Date().getTime()
            let estimatedDuration = result.estimatedDuration
            let progress = -1
            if (estimatedDuration && estimatedDuration !== -1) {
              progress = Math.ceil(((nowTime - startTime) / estimatedDuration) * 100)
              if (progress >= 100) {
                progress = 99
              }
            }
            job['progress'] = progress
            setProgress(job)
          }
        })
      } else {
        await store.dispatch("queueItemAct",job.curBuildingQueueItemId).then(res => {
          let result = res
          if (result.executable && result.executable.number) {
            job['curBuildingNumber'] = result.executable.number
            job['buildStatus'] = 'BUILDING'
            job['anime'] = true
            job['progress'] = -1
          }
          if (result.cancelled === true) {
            job['buildStatus'] = 'FINISH'
          }
        })
      }
    }

    /**
     * 定时获取构建进度
     */
    const timingGetBuildProgress = async (job: any) => {
      let timing = true
      try {
        await getBuildProgress(job)
        if (job.buildStatus === 'FINISH') {
          let notify = '构建结束！'
          timing = false
          switch (job.buildResult) {
            case 'SUCCESS':
              notify = '构建成功！'
              break
            case 'UNSTABLE':
              notify = '构建结束，结果不稳定！'
              break
            case 'FAILURE':
              notify = '构建失败！'
              break
            case 'NOT_BUILT':
              notify = '构建未开始！'
              break
            case 'ABORTED':
              notify = '构建中止！'
              break
          }
          utools.showNotification(job.name + notify)
        } else {
          job.progressTask = setTimeout(() => timingGetBuildProgress(job), 5000)
        }
      } catch (e) {
        timing = false
        utools.showNotification(job.name + '构建中止！')
      } finally {
        if (!timing) {
          let data = await store.dispatch("jobDetailsAct", job.name).then(res => res)// this.jenkins.getJob(job.name).then(res => res.data);
          job['color'] = data.color
          utils.jobStatusToIcon(job)
          await jobLastBuild(job)
        }
      }
    }

    /**
     * 获取任务上一次构建内容
     * @param job
     * @returns {Promise<void>}
     */
    const jobLastBuild = async (job: any) => {
        const params = {
            jobName:job.name,
            buildNum:"lastBuild"
        }
        try {
            const result = await store.dispatch("buildHistoryAct",params)
            job.lastBuildTime = result.timestamp;
            if (result.changeSet && result.changeSet.items.length > 0) {
                let item = result.changeSet.items[result.changeSet.items.length - 1];
                job.lastChange = item.msg + " (" + item.authorEmail + ")";
            }
            if (result.building) {
                job.buildStatus = 'BUILDING'
                job.curBuildingNumber = result.number
                timingGetBuildProgress(job)
            }
        } catch (error: any) {
            console.log(error,"=====",error.response.status,"jobLastBuild catch -----------------------------------------")
        }
    }

    const jobsList = (viewName: string) => {
        store.dispatch("jobsAct",viewName).then(res => {
            
            const js = res.jobs
            for (let job of js) {
                job.lastBuildTime = 'N/A';
                utils.jobStatusToIcon(job)
                jobLastBuild(job)
            }

            setTimeout(() => {
                jobs.value = js
            }, 300)
        })
    }

    const viewNameList = () => {
        store.dispatch("baseInfoAct").then(res => {
            const vns = res.views;
            const selectVns = []
            for (let vn of vns) {
                selectVns.push({
                    label: vn.name,
                    value: vn.name,
                })
            }
            viewNames.value = selectVns
        })
    }

    const handleJKNameValue = (value: string, option: SelectOption) => {
        store.dispatch("configAct",option.data)
        jobsList(viewName.value)
    }

    const handleViewNameValue = (value: string, option: SelectOption) => {
        jobsList(value)
    }

    const refreshJobsList = () => {
        jobsList(viewName.value)
        setTimeout(() => {
            message.success("刷新成功")
        }, 100)
    }

    const filterJobList = computed(()=> {
        let filter = jobs.value.filter((e:any) => e?.name?.match(jobName.value));
        for (let i = 0; i < filter.length; i++) {
            filter[i].index = i
        }
        return filter;
    })

    return {
      configList,
      jkName,
      viewName,
      jobName,
      viewNames,
      filterJobList,
      columns: createColumns( { buildJob }, { cancelBuildJob }, { viewLog } ),
      handleJKNameValue,
      handleViewNameValue,
      refreshJobsList,
      jobsList,
      viewNameList
    };
  },
  beforeMount() {
    console.log("beforeMount----------------------");
    this.viewNameList()
    this.jobsList("all")
  },
  mounted() {
    console.log("mounted----------------------");
  },
});
</script>

<template>
  <n-grid x-gap="12" :cols="4">
    <n-gi>
      <n-select
        v-model:value="jkName"
        :options="configList" 
        @update:value="handleJKNameValue"/>
    </n-gi>
    <n-gi>
      <n-select 
        v-model:value="viewName" 
        :options="viewNames" 
        @update:value="handleViewNameValue"/>
    </n-gi>
    <n-gi>
      <n-input v-model:value="jobName" type="text" placeholder="任务名称" />
    </n-gi>
    <n-gi>
      <n-button type="success" @click="refreshJobsList">刷新列表</n-button>
    </n-gi>
  </n-grid>
  <n-data-table
    :columns="columns"
    :data="filterJobList"
    class="data-table"/>
</template>

<style scoped>
.data-table {
  margin-top: 10px;
}
</style>