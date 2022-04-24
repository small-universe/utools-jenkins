<script lang="ts">
import { h, defineComponent,ref,computed } from 'vue'
import { FormInst, NButton, NIcon, useMessage,useDialog } from "naive-ui";
import { Edit,Delete } from '@vicons/carbon'
import utils from "@/utils/toolsbox"

const utools = window.utools

const createColumns = ({ editConfig }:{ editConfig: (row: any) => void},{ deleteConfig }:{ deleteConfig: (row: any) => void}) => {
    return [
    {
        title: '名称',
        width: 100,
        key: 'data.name'
    },
    {
        title: 'URL',
        key: 'data.url',
        width: 100,
        ellipsis: {
        tooltip: true
        }
    },
    {
        title: '用户名',
        key: 'data.username',
        width: 100,
        ellipsis: {
        tooltip: true
        }
    },
    {
        title: '操作',
        key: "actions",
        width: 100,
        fixed: "right",
        render(row: any) {
            const ops = [
            h(NButton, {
                strong: true,
                secondary: true,
                circle: true,
                type: "success",
                title: "编辑配置",
                onClick: () => editConfig(row)
            },
            {
                icon: () => h(NIcon, {
                    component: Edit
                })
            }
          ),

          h(NButton, {
                strong: true,
                secondary: true,
                circle: true,
                type: "success",
                title: "删除配置",
                style: {
                    marginLeft: '10px'
                },
                onClick: () => deleteConfig(row)
          },
          {
              icon: () => h(NIcon , {
                  component: Delete
              })
          }
          )
        ];
        return ops;
        }
    }
    ]
}

const initModel = () => {
    const obj = {
        name: null,
        url: null,
        username: null,
        token: null,
      }
    return obj
}

const rules = {
        name: {
          required: true,
          trigger: ['blur', 'input'],
          message: '请输入Jenkins名称'
        },
        url: {
          required: true,
          trigger: ['blur', 'input'],
          message: '请输入Jenkins URL'
        },
        username: {
          required: true,
          trigger: ['blur', 'input'],
          message: '请输入Jenkins用户名'
        },
        token: {
          required: true,
          trigger: ['blur', 'input'],
          message: '请输入Jenkins Token'
        }
      }

function getConfList() {
  let allDocs = utools.db.allDocs("jenkins");
  let ret = [];
  if (allDocs.length > 0) {
    for (let i = 0; i < allDocs.length; i++) {
      let data = allDocs[i];
      ret.push(data);
    }
  }
  return ret;
}

export default defineComponent({
    name: "Config",
    computed: {

    },
    setup() {

        const showModalRef = ref(false)
        const formRef = ref<FormInst | null>(null)
        const message = useMessage()
        const dialog = useDialog()
        let modelRef = ref(initModel())
        const modifyConfig = ref<any>(null)

        let dataList = ref<any>(getConfList())

        const addConfigModel = () => {
           
            showModalRef.value = true
        }

        const handleSaveConfig = () => {
            formRef.value?.validate((errors) => {
                if (!errors) {
                   
                    let config:any = {
                       _id: modifyConfig.value.id || "",
                        data: {
                            name: modelRef.value.name,
                            url: modelRef.value.url,
                            username: modelRef.value.username,
                            token: modelRef.value.token
                        },
                        _rev: modifyConfig.value.rev
                    }

                    if(!config._id) {
                        config._id = "jenkins-" + utils.uuid()
                    }

                    config._rev || delete config._rev

                    const result = utools.db.put(config)
                    if(!result.ok) {
                        message.error("保存失败")
                        return
                    }

                    dataList.value = getConfList()

                    message.success("保存成功")

                    modelRef.value = initModel()
                    modifyConfig.value = {}

                    showModalRef.value = false
                } else {
                    console.log(errors)
                    message.error("验证失败")
                }
            })
        }

        const editConfig = (rowData: any) => {
            modelRef.value = rowData.data
            showModalRef.value = true
            modifyConfig.value = {id: rowData._id, rev: rowData._rev}
        }

        const deleteConfig = (rowData: any) => {
            dialog.warning({
                title: "温馨提示",
                content: "您确定要删除，" + rowData.data.name + "任务吗？",
                positiveText: "确定",
                onPositiveClick: () => {
                    const result = utools.db.remove(rowData._id)
                    if(result.ok) {
                        dataList.value = getConfList()
                        message.success("删除成功")
                    } else {
                        message.error("删除失败！")
                    }
                }
            })
            
        }

        return {
            formRef,
            showEditModal: showModalRef,
            data: dataList,
            columns: createColumns({ editConfig }, { deleteConfig }),
            addConfigModel,
            handleSaveConfig,
            model: modelRef,
            rules,
            size: ref('medium'),
            modifyConfig
        }
    },
})
</script>

<template>
    <div class="btn-wapper">
        <n-button type="primary" @click="addConfigModel">新增配置</n-button>
    </div>
    
    <n-data-table :columns="columns" :data="data"/>

    <n-modal v-model:show="showEditModal" 
        preset="dialog" 
        title="Dialog" 
        positive-text="保存"
        @positive-click="handleSaveConfig"
        :close-on-esc="false"
        :mask-closable="false"
        :showIcon="false"
        style="width: 600px;">
        <template #header>
            <div>新增配置</div>
        </template>
        <div>
            <n-form
                ref="formRef"
                :model="model"
                :rules="rules"
                label-placement="left"
                label-width="auto"
                require-mark-placement="right-hanging"
                :size="size"
                :style="{
                    maxWidth: '740px'
                }"
            >
                <n-form-item label="名称" path="name">
                    <n-input v-model:value="model.name" placeholder="名称" />
                </n-form-item>
                <n-form-item label="JenkinsURL" path="url">
                    <n-input v-model:value="model.url" placeholder="Jenkins地址" />
                </n-form-item>
                <n-form-item label="用户名" path="username">
                    <n-input v-model:value="model.username" placeholder="用户名" />
                </n-form-item>
                <n-form-item label="Token" path="token">
                    <n-input v-model:value="model.token" placeholder="令牌" />
                </n-form-item>
            </n-form>
        </div>
        <template #action>
            <div style="height: 50px;"></div>
            <n-button type="primary" @click="handleSaveConfig">保存</n-button>
        </template>
    </n-modal>
</template>

<style scoped>
    .btn-wapper {
        margin-bottom: 10px;
        text-align: right;
    }
</style>