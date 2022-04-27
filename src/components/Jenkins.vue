<script lang="ts">
import { NButton, NIcon,NTime,SelectOption, useMessage, useDialog } from "naive-ui";
import { Construct as ConstructIcon, CloseCircleOutline } from "@vicons/ionicons5";
import { ChangeCatalog } from "@vicons/carbon";
import { h, defineComponent, ref, computed } from "vue";
import { useStore } from 'vuex'
import utils from "@/utils/toolsbox";
import StatusIcon from "@/components/StatusIcon.vue"

const utools = window.utools

type TableFunArg = (row: any, index: number) => void
type TableFunArg2 = (row: any) => void

const createColumns = (
  { buildJob }: { buildJob: TableFunArg },
  { cancelBuildJob }: { cancelBuildJob: TableFunArg2 },
  { viewLog }: { viewLog: TableFunArg2 },
  { handleJobName }: { handleJobName: TableFunArg2 }
) => {
  return [
    {
      title: "状态",
      width: 48,
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
      render(row: any) {
          return h(
              NButton,
              {
                  text: true,
                  tag: 'a',
                  target: '_blank',
                  onClick: () =>handleJobName(row),
              },
              { default: () => row.name }
          )
      },
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
    const showLogModal = ref(false)
    const buildLog = ref("")
    const logJobName = ref("")
    const logLoading = ref(false)
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
                     message.error("构建失败")
                })
            }
        })
    };

    const cancelBuildJob = (job: any) => {
        dialog.info({
            title: "温馨提示",
            content: "您确定要取消，" + job.name + "任务吗？",
            positiveText: "确定",
            onPositiveClick: () => {
               if (job.curBuildingNumber) {
                   store.dispatch("cancelBuildAct", { jobName: job.name, num: job.curBuildingNumber}).then(res => {
                        message.success("取消任务成功")
                   }).catch(err => {
                        message.error("取消任务失败")
                   })
                } else if (job.curBuildingQueueItemId) {
                    store.dispatch("cancelQueueItemAct", job.curBuildingQueueItemId).then(res => {
                        message.success("取消队列成功")
                    }).catch(err => {
                        message.error("取消队列失败")
                    })
                }
                
            }
        })
    }

    const viewLog = (job: any) => {
        buildLog.value = ""
        // this.currentJob = job
        logJobName.value = job.name
        job.fetchedSize = 0
        showLogModal.value = true
        logLoading.value = true
        if (job.buildStatus && (job.buildStatus === 'SUBMIT' || job.buildStatus === 'BUILDING')) {
            timingGetBuildConsole(job)
            logLoading.value = false
        } else {
            store.dispatch("buildConsoleAct", { jobName: job.name, number: 'lastBuild', start: 0 }).then(res => {
                buildLog.value = res.data
                logLoading.value = false
            }).catch(err => {
                console.log(err, "viewLog-------------------")
                if(err.response.status == 404) {
                    buildLog.value = "暂无日志"
                }
                logLoading.value = false
            })
        }
    };

    const timingGetBuildConsole = async (job: any) => {
      if (job.buildStatus === 'FINISH') {
        return false
      }
      if (!job.curBuildingNumber) {
        job.buildConsoleTask = setTimeout(() => timingGetBuildConsole(job), 5000)
        return true
      }
      try {
        return await store.dispatch("buildConsoleAct", { jobName: job.name, number: 'lastBuild', start: 0 }).then(res => {
          if (res.headers['content-length'] === 0) {
            job.buildConsoleTask = setTimeout(() => timingGetBuildConsole(job), 5000)
            return true
          }
          buildLog.value = buildLog.value + res.data
          let moreData = res.headers['x-more-data']
          job.fetchedSize = res.headers['x-text-size']
          if (moreData && moreData !== false) {
            job.buildConsoleTask = setTimeout(() => timingGetBuildConsole(job), 3000)
          }
        })
      } catch (e) {
        return false
      }
    }

    const setProgress = (job:any) => {
    //   let row = document.querySelectorAll('.el-table__fixed .el-table__row > td:nth-child(2)').item(job.index);
      let row = document.querySelectorAll('.n-data-table-table .n-data-table-tbody .n-data-table-tr > td:nth-child(2)').item(job.index);
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
          let result = res.data
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
          let data = await store.dispatch("jobDetailsAct", job.name).then(res => res.data)// this.jenkins.getJob(job.name).then(res => res.data);
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
            const res = await store.dispatch("buildHistoryAct",params)
            const result = res.data
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

    const handleJobName = (job: any) => {
        utools.shellOpenExternal(store.getters.jenkinsUrl + '/job/' + job.name)
    }

    const handleCloseLogModel = () => {
        showLogModal.value = false
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
      columns: createColumns( { buildJob }, { cancelBuildJob }, { viewLog }, { handleJobName } ),
      handleJKNameValue,
      handleViewNameValue,
      refreshJobsList,
      handleCloseLogModel,
      handleJobName,
      buildLog,
      jobsList,
      viewNameList,
      showLogModal,
      logJobName,
      logLoading
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

    <n-modal v-model:show="showLogModal" 
        preset="dialog" 
        title="Dialog" 
        @close="handleCloseLogModel"
        :close-on-esc="false"
        :mask-closable="false"
        :showIcon="false"
        style="width: 750px;height:450px;">
        <template #header>
            <div>查看日志({{logJobName}})</div>
        </template>
        <pre class="console-output" v-html="buildLog"></pre>
    </n-modal>
</template>

<style scoped>
.data-table {
  margin-top: 10px;
}
pre, code, kbd, samp, tt {
    font-size: var(--font-size-monospace);
}
pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0 0 var(--section-padding);
    padding: 0.8rem 1rem;
    border-radius: 10px;
    background-color: var(--pre-background);
    color: var(--pre-color) !important;
    font-family: var(--font-family-mono) !important;
    font-weight: 500 !important;
    line-height: 1.66 !important;
}
.console-output {
    max-height: 360px;
    overflow-y: auto;
    background-color: #f2f2f2;
}
</style>