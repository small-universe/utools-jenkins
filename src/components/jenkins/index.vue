<script lang="ts">
import {
  NButton, NIcon, NTime, SelectOption, useMessage, useDialog,
  NBreadcrumb, NBreadcrumbItem
} from "naive-ui";
import {
  Construct as ConstructIcon, CloseCircleOutline, Home,
  CaretForwardOutline, RefreshSharp
} from "@vicons/ionicons5";
import { ChangeCatalog, HelpFilled } from "@vicons/carbon";
import { h, defineComponent, ref, computed, nextTick, watch } from "vue";
import { useStore } from 'vuex'
import utils from "@/utils/toolsbox";
import StatusIcon from "@/components/status-icon/index.vue"
import { JenkinsClassTypeEnum } from "./model";
import { buildJob } from "@/api/jenkins";
import { whileStatement } from "@babel/types";

const utools = window.utools

type TableFunArg = (row: any, index: number) => void
type TableFunArg2 = (row: any) => void

const createColumns = (
  { buildJobParamsDialog }: { buildJobParamsDialog: TableFunArg },
  { cancelBuildJob }: { cancelBuildJob: TableFunArg2 },
  { showLog }: { showLog: TableFunArg2 },
  { handleJobName }: { handleJobName: TableFunArg2 },
  { handleWorkflowJobIcon }: { handleWorkflowJobIcon: TableFunArg2 },
  { getJobLastBuild }: { getJobLastBuild: TableFunArg2 }
) => {
  return [
    {
      title: '状态',
      width: 90,
      render(row: any) {
        return h(StatusIcon, {
          name: row.icon,
          color: row.color,
          anime: row.anime,
          isWorkflow: row.isWorkflow,
          onClick: () => {
            if (row._class === JenkinsClassTypeEnum.WORKFLOW_MULTI_BRANCH_PROJECT) {
              handleWorkflowJobIcon(row)
            }
          }
        })
      }
    },
    {
      title: '名称',
      key: 'displayName',
      width: 160,
      fixed: 'left',
      render(row: any) {
        return h('a',
          {
            text: row.name,
            href: "",
            target: '_blank',
            onClick: () => handleJobName(row),
          }
        )
      },
    },
    {
      title: '最近构建时间',
      key: 'lastBuildTime',
      width: 150,
      render(row: any) {
        // getJobLastBuild(row)
        if (!(row.lastBuildTime) || row.lastBuildTime === 'N/A') {
          return h('span', ['N/A'])
        } else {
          return h(NTime, {
            time: row.lastBuildTime,
            format: 'yyyy-MM-dd HH:mm:ss'
          })
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render(row: any, index: number) {
        const ops = [];
        if (row.buildStatus && row.buildStatus !== 'FINISH') {
          ops[0] = h(
            NButton,
            {
              strong: true,
              secondary: true,
              circle: true,
              type: 'success',
              title: '取消',
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
              type: 'success',
              title: '构建',
              disabled: row._class === JenkinsClassTypeEnum.WORKFLOW_MULTI_BRANCH_PROJECT,
              onClick: () => buildJobParamsDialog(row, index),
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
            type: 'success',
            title: '查看日志',
            disabled: row._class === JenkinsClassTypeEnum.WORKFLOW_MULTI_BRANCH_PROJECT,
            style: {
              marginLeft: '10px',
            },
            onClick: () => showLog(row),
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
  let jks: any[] = []
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
  name: 'Jenkins',
  components: { StatusIcon, HelpFilled, Home, CaretForwardOutline, RefreshSharp },
  setup() {
    const store = useStore()
    const message = useMessage()
    const dialog = useDialog()
    const showbuildParamsModal = ref<boolean>(false)
    const buildParamsLoading = ref<boolean>(false)
    const showLogModal = ref<boolean>(false)
    const currentBuildJob = ref<any>({})
    const jobParameterTypeOfSelectNoChoice = ref(['PT_MULTI_SELECT', 'PT_SINGLE_SELECT', 'PT_TAG', 'PT_BRANCH', 'PT_BRANCH_TAG', 'PT_REVISION', 'PT_PULL_REQUEST'])
    const buildLog = ref<string>('')
    const logJobName = ref<string>('')
    const logLoading = ref<boolean>(false)
    const configList = ref<any>(jenkinsList());
    const jkName = ref(configList?.value[0]?.value || null)
    const jobs = ref<any>([{}])
    const jobName = ref('')
    const viewNames = ref<any>([{}])
    const viewName = ref('所有')
    const breadCrumb = ref<any>({ 'view': { 'name': 'all', 'displayName': '所有' }, 'workflow': null, 'job': null })

    store.dispatch('configAct', configList?.value[0]?.data)

    const buildJobParamsDialog = async (job: any, index: number) => {
      buildParamsLoading.value = true
      if (!job.form) {
        job.form = {}
      }
      try {
        // const job = {}
        const data = await store.dispatch('getJobAct', job.fullName).then(res => res.data);
        job.property = data.property
        job.description = data.description
        job.displayName = data.displayName
        job.parameterProcessed = []
        if (job.property && job.property.length > 0) {
          for (let property of job.property) {
            if (!property || !property.parameterDefinitions || property.parameterDefinitions.length === 0) {
              continue
            }
            for (let param of property.parameterDefinitions) {
              job.form[param.name] = param.defaultParameterValue ? param.defaultParameterValue.value : '';
              await store.dispatch('handleGitParameterAct', { job: job, param: param });
              job.parameterProcessed.push(param)
            }
          }
        }

      } finally {
        buildParamsLoading.value = false
      }

      showbuildParamsModal.value = true
      currentBuildJob.value = job
    };

    const startBuildJob = () => {
      store.dispatch('buildJobAct', { jobName: currentBuildJob.value.fullName, parameters: currentBuildJob.value.form }).then((res) => {
        const job = currentBuildJob.value

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
        message.success('开始构建')
        showbuildParamsModal.value = false
      }).catch(err => {
        message.error(`构建失败 fail reason ==> ${err}`)
        showbuildParamsModal.value = false
      })
    }

    const cancelBuildJob = (job: any) => {
      dialog.info({
        title: '温馨提示',
        content: '您确定要取消，' + job.name + '任务吗？',
        positiveText: '确定',
        onPositiveClick: () => {
          if (job.curBuildingNumber) {
            store.dispatch('cancelBuildAct', { jobName: job.fullName, num: job.curBuildingNumber }).then(res => {
              message.success('取消任务成功')
            }).catch(err => {
              message.error('取消任务失败')
            })
          } else if (job.curBuildingQueueItemId) {
            store.dispatch('cancelQueueItemAct', job.curBuildingQueueItemId).then(res => {
              message.success('取消队列成功')
            }).catch(err => {
              message.error('取消队列失败')
            })
          }

        }
      })
    }

    const showLog = async (job: any) => {
      buildLog.value = ''
      logJobName.value = job.name
      job.fetchedSize = 0
      showLogModal.value = true
      await getLog(job).then(() => setTimeout(() => logLoading.value = false, 1000))
    };

    const getLog = async (job: any) => {
      return new Promise((resolve, reject) => {
        if (job.buildStatus && (job.buildStatus === 'SUBMIT' || job.buildStatus === 'BUILDING')) {
          timingGetBuildConsole(job)
        } else {
          store.dispatch('buildConsoleAct', { jobName: job.fullName, number: 'lastBuild', start: 0 }).then(res => {
            buildLog.value = res.data
          }).catch(err => {
            console.error(`[getLog] ==> param ==> ${job} fail reason => ${err}`)
            if (err.response.status == 404) {
              buildLog.value = '暂无日志'
            }
          })
        }
        resolve('success')
      })
    }

    const timingGetBuildConsole = async (job: any) => {
      if (job.buildStatus === 'FINISH') {
        return false
      }
      if (!job.curBuildingNumber) {
        job.buildConsoleTask = setTimeout(() => timingGetBuildConsole(job), 5000)
        return true
      }
      try {
        return await store.dispatch('buildConsoleAct', { jobName: job.fullName, number: 'lastBuild', start: 0 }).then(res => {
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

    const setProgress = (job: any) => {
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
          jobName: job.name,
          buildNum: job.curBuildingNumber
        }
        store.dispatch('buildHistoryAct', params).then(res => {
          let result = res.data
          if (result.building === false && result.result) {
            job['buildStatus'] = 'FINISH'
            job['buildResult'] = result.result
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
        await store.dispatch('queueItemAct', job.curBuildingQueueItemId).then(res => {
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
          let data = await store.dispatch('jobDetailsAct', job.name).then(res => res.data)
          job['color'] = data.color
          utils.jobStatusToIcon(job)
          await getJobLastBuild(job)
        }
      }
    }

    /**
     * 获取任务上一次构建内容
     * @param job
     * @returns {Promise<void>}
     */
    const getJobLastBuild = async (job: any) => {
      const params = {
        jobName: job.fullName,
        buildNum: 'lastBuild'
      }

      try {
        const res = await store.dispatch('buildHistoryAct', params)
        const result = res.data
        job.lastBuildTime = result.timestamp;
        if (result.changeSet && result.changeSet.items.length > 0) {
          let item = result.changeSet.items[result.changeSet.items.length - 1];
          job.lastChange = item.msg + ' (' + item.authorEmail + ')';
        }
        if (result.building) {
          job.buildStatus = 'BUILDING'
          job.curBuildingNumber = result.number
          timingGetBuildProgress(job)
        }
      } catch (error: any) {
        console.error(`[getJobLastBuild] param ==> ${job} ==> fail reason ==> ${error}`)
      }


    }

    const getJobList = (viewName: string, workflowName: string) => {
      store.dispatch('jobsAct', { viewName, workflowName }).then(async res => {
        const jobList = res.jobs
        for (let job of jobList) {
          job.lastBuildTime = 'N/A'
          utils.jobStatusToIcon(job)

          switch (job._class) {
            case JenkinsClassTypeEnum.FREE_STYLE_PROJECT:
              job.fullName = job.name
              break
            case JenkinsClassTypeEnum.WORKFLOW_MULTI_BRANCH_PROJECT:
              job.fullName = job.name
              break
            case JenkinsClassTypeEnum.WORKFLOW_JOB:
              job.fullName = workflowName + '/job/' + job.name
              break
          }

          // 设置面包屑数据
          if (!!viewName) {
            breadCrumb.value.view = { name: viewName, displayName: (viewName === 'all' ? '所有' : viewName) }
          }
          if (!workflowName) {
            breadCrumb.value.workflow = null
          }

        }

        jobs.value = jobList
        store.dispatch('listLoadingAct', false)
      }).catch(err => {
        store.dispatch('listLoadingAct', false)
        message.error('加载列表失败！')
      })

      clearJobNameSearch()
    }

    const clearJobNameSearch = () => {
      // 清除job搜索框
      jobName.value = ''
    }

    const viewNameList = () => {
      store.dispatch('baseInfoAct').then(res => {
        const vns = res.views;
        const selectVns = []
        for (let vn of vns) {
          selectVns.push({
            label: vn.name === 'all' ? '所有' : vn.name,
            value: vn.name,
          })
        }
        viewNames.value = selectVns
      })
    }

    const handleJKNameValue = (value: string, option: SelectOption) => {
      store.dispatch('configAct', option.data)
      store.dispatch('listLoadingAct', true)
      viewNameList()
      viewName.value = '所有'
      getJobList('all', '')
    }

    const handleViewNameValue = (value: string, option: SelectOption) => {
      getJobList(value, '')
    }

    const refreshJobsList = () => {
      getJobList(breadCrumb.value.view.name, breadCrumb.value.workflow.name)
      setTimeout(() => {
        message.success('刷新成功')
      }, 100)
    }

    const handleJobName = (job: any) => {
      utools.shellOpenExternal(job.url)
    }

    const handleWorkflowJobIcon = (workflow: any) => {
      getJobList('', workflow.name)
      breadCrumb.value.workflow = { name: workflow.name, displayName: workflow.name }
    }

    const handleCloseLogModel = () => {
      showLogModal.value = false
    }

    const handleBreadCrumb = (viewName: string) => {
      getJobList(viewName, '')
    }

    watch(buildLog, () => {
      nextTick(() => {
        const logView = document.getElementById('logView')
        logView!.scrollTop = logView!.scrollHeight
      })
    })

    const filterJobList = computed(() => {
      let filter = jobs.value.filter((e: any) => e?.name?.toLowerCase().match(jobName.value?.toLowerCase()));
      for (let i = 0; i < filter.length; i++) {
        filter[i].index = i
      }
      return filter;
    })

    const showLoading = computed(() => {
      return store.getters.listLoading
    })

    const paramsSelectOptions = (params: any) => {
      const options: any = []
      if (currentBuildJob.value && currentBuildJob.value.parameterProcessed && currentBuildJob.value.parameterProcessed.length > 0) {
        if (jobParameterTypeOfSelectNoChoice.value.indexOf(params.type) !== -1) {
          for (const k1 in params.choices) {
            if (params.choices[k1] == '') {
              continue
            }
            options.push({
              label: params.choices[k1].text,
              value: params.choices[k1].value
            })
          }
        } else {
          for (const k2 in params.choices) {
            if (params.choices[k2] == '') {
              continue
            }
            options.push({
              label: params.choices[k2],
              value: params.choices[k2]
            })
          }
        }
      }
      return options
    }

    return {
      jobParameterTypeOfSeparator: ref(['ParameterSeparatorDefinition']),
      jobParameterTypeOfFile: ref(['FileParameterDefinition', 'PatchParameterDefinition']),
      jobParameterTypeOfTextArea: ref(['TextParameterDefinition', 'PersistentTextParameterDefinition']),
      jobParameterTypeOfCheckbox: ref(['BooleanParameterDefinition', 'PersistentBooleanParameterDefinition', '']),
      jobParameterTypeOfInput: ref(['StringParameterDefinition', 'DateParameterDefinition',
        'LabelParameterDefinition', 'PersistentStringParameterDefinition', 'PasswordParameterDefinition', 'PT_TEXTBOX']),
      jobParameterTypeOfSelect: ref(['ChoiceParameterDefinition', 'CascadeChoiceParameter', 'BooleanParameterDefinition',
        'NodeParameterDefinition', 'PersistentChoiceParameterDefinition',
        'PT_MULTI_SELECT', 'PT_SINGLE_SELECT', 'PT_TAG', 'PT_BRANCH', 'PT_BRANCH_TAG', 'PT_REVISION', 'PT_PULL_REQUEST']),
      jobParameterTypeOfSelectNoChoice,
      configList,
      jkName,
      viewName,
      jobName,
      breadCrumb,
      viewNames,
      filterJobList,
      columns: createColumns({ buildJobParamsDialog }, { cancelBuildJob }, { showLog }, { handleJobName }, { handleWorkflowJobIcon }, { getJobLastBuild }),
      handleJKNameValue,
      handleViewNameValue,
      refreshJobsList,
      handleCloseLogModel,
      handleJobName,
      handleBreadCrumb,
      buildLog,
      getJobList,
      viewNameList,
      showbuildParamsModal,
      buildParamsLoading,
      currentBuildJob,
      startBuildJob,
      paramsSelectOptions,
      showLogModal,
      logJobName,
      logLoading,
      showLoading
    };
  },
  beforeMount() {

    if (!this.$store.getters.listLoading) {
      this.$store.dispatch('listLoadingAct', true)
      this.viewNameList()
      this.getJobList('all', '')
    }
  },
  mounted() {
  }
});
</script>

<template>
  <n-grid x-gap="12" :cols="4">
    <n-gi>
      <n-select v-model:value="jkName" :options="configList" @update:value="handleJKNameValue" />
    </n-gi>
    <n-gi>
      <n-select v-model:value="viewName" :options="viewNames" @update:value="handleViewNameValue" />
    </n-gi>
    <n-gi>
      <n-input v-model:value="jobName" type="text" placeholder="任务名称" />
    </n-gi>
    <n-gi>
      <n-button type="success" @click="refreshJobsList">
        <n-icon size="18">
          <refresh-sharp />
        </n-icon>
        <span>刷新</span>
      </n-button>
    </n-gi>
  </n-grid>

  <!-- 面包屑 -->
  <div class="bread-crumb">
    <n-breadcrumb>
      <n-breadcrumb-item class="bread-crumb-item" @click="handleBreadCrumb(breadCrumb.view.name)">
        <n-icon color="#0e7a0d" size="18">
          <home />
        </n-icon>
        <span style="font-size: 18px; margin: 0px 5px;">{{ breadCrumb.view.displayName }} </span>
      </n-breadcrumb-item>
      <n-breadcrumb-item v-if="!!breadCrumb.workflow">
        <n-icon class="icon" color="#0e7a0d" size="18">
          <CaretForwardOutline />
        </n-icon>
        <span style="font-size: 18px;">{{ breadCrumb.workflow.displayName }} </span>
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>

  <!-- 数据表格 -->
  <n-data-table class="data-table" 
    :bordered="false"
    :single-line="false"
    :max-height=580 
    :loading="showLoading" 
    :columns="columns" 
    :data="filterJobList" 
  />

  <!-- 获取构建参数弹出框 -->
  <n-modal v-model:show="showbuildParamsModal" preset="dialog" title="Dialog" :close-on-esc="false"
    :mask-closable="true" :showIcon="false" :auto-focus="true">
    <template #header>
      <div>构建({{ currentBuildJob.name }})</div>
    </template>
    <n-space vertical>
      <n-spin :show="buildParamsLoading">
        <n-form-item label="描述" v-if="currentBuildJob.description">
          <label style="color: #a19f9d;">{{ currentBuildJob.description }}</label>
        </n-form-item>
        <n-form ref="buildJobRef" :model="currentBuildJob" v-if="currentBuildJob.parameterProcessed">
          <template v-for="params in currentBuildJob.parameterProcessed" v-bind:key="params.name">
            <n-form-item>
              <template #label>
                {{ params.name }}&nbsp;
                <n-tooltip trigger="hover" v-if="params.description">
                  <template #trigger>
                    <n-icon size="20" color="#a19f9d">
                      <help-filled />
                    </n-icon>
                  </template>
                  {{ params.description }}
                </n-tooltip>
              </template>
              <n-input v-if="jobParameterTypeOfInput.indexOf(params.type) !== -1"
                :type="params.type === 'PasswordParameterDefinition' ? 'password' : 'text'"
                v-model:value="currentBuildJob.form[params.name]" />
              <n-input v-else-if="jobParameterTypeOfTextArea.indexOf(params.type) !== -1" type="textarea"
                v-model:value="currentBuildJob.form[params.name]" />
              <n-select
                v-else-if="jobParameterTypeOfSelect.indexOf(params.type) !== -1 && params.choices && params.choices.length !== 0"
                v-model:value="currentBuildJob.form[params.name]" :multiple="params.type === 'PT_MULTI_SELECT'"
                :options="paramsSelectOptions(params)" filterable />
              <n-switch v-else-if="jobParameterTypeOfCheckbox.indexOf(params.type) !== -1"
                v-model:value="currentBuildJob.form[params.name]" />
              <label v-else>不支持的参数类型：{{ params.type }}</label>
            </n-form-item>
          </template>
        </n-form>
        <template #description>
          加载构建参数......
        </template>
      </n-spin>
    </n-space>
    <template #action>
      <div style="height: 50px;"></div>
      <n-button type="primary" @click="startBuildJob">开始构建</n-button>
    </template>
  </n-modal>
  <!-- 日志弹出框 -->
  <n-modal v-model:show="showLogModal" preset="dialog" title="Dialog" @close="handleCloseLogModel" :close-on-esc="false"
    :mask-closable="false" :showIcon="false" style="width: 750px;height:450px;">
    <template #header>
      <div>查看日志({{ logJobName }})</div>
    </template>
    <n-space vertical>
      <n-spin :show="logLoading">
        <pre id="logView" class="console-output" v-html="buildLog"></pre>
        <template #description>
          加载日志......
        </template>
      </n-spin>
    </n-space>

  </n-modal>
</template>

<style scoped>
.data-table {
  margin-top: 10px;
}

pre,
code,
kbd,
samp,
tt {
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
  background-color: #bbccdc73;
}

.bread-crumb {
  margin-top: 20px;
}

a {
  text-decoration: none;
  /* 去除默认的下划线 */
  outline: none;
  /* 去除旧版浏览器的点击后的外虚线框 */
  color: #000;
  /* 去除默认的颜色和点击后变化的颜色 */
}

.bread-crumb-item {
  /* 手指样式 */
  cursor: pointer;
}

/* svg相对定位 */
.bread-crumb .n-icon {
  position: relative;
  top: 2px;
}

.n-button .n-icon {
  position: relative;
  top: -2px;
}

/* 模态框调整样式 */
.n-dialog.n-modal {
  width: 21% !important;
}

.n-modal {
  max-height: 200px !important;
  overflow-y: scroll;
}
</style>