<script lang="ts">
import { h, defineComponent, ref, computed } from "vue";
import {
  FormInst,
  NButton,
  NIcon,
  useMessage,
  useDialog,
  FormItemRule,
} from "naive-ui";
import { Edit, Delete, HelpFilled } from "@vicons/carbon";
import utils from "@/utils/toolsbox";
import { useStore } from "vuex";
import { urlRegexUtil } from "@/utils/regex";

const utools = window.utools;

const createColumns = (
  { editConfig }: { editConfig: (row: any) => void },
  { deleteConfig }: { deleteConfig: (row: any) => void }
) => {
  return [
    {
      title: "名称",
      width: 100,
      key: "data.name",
    },
    {
      title: "URL",
      key: "data.url",
      width: 100,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      title: "用户名",
      key: "data.username",
      width: 100,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 100,
      fixed: "right",
      render(row: any) {
        const ops = [
          h(
            NButton,
            {
              strong: true,
              secondary: true,
              circle: true,
              type: "success",
              title: "编辑配置",
              onClick: () => editConfig(row),
            },
            {
              icon: () =>
                h(NIcon, {
                  component: Edit,
                }),
            }
          ),

          h(
            NButton,
            {
              strong: true,
              secondary: true,
              circle: true,
              type: "success",
              title: "删除配置",
              style: {
                marginLeft: "10px",
              },
              onClick: () => deleteConfig(row),
            },
            {
              icon: () =>
                h(NIcon, {
                  component: Delete,
                }),
            }
          ),
        ];
        return ops;
      },
    },
  ];
};

const initModel = () => {
  const obj = {
    _id: null,
    name: null,
    url: null,
    username: null,
    token: null,
    _rev: null,
  };
  return obj;
};

const rules = {
  name: {
    required: true,
    trigger: ["blur", "input"],
    message: "请输入Jenkins名称",
  },
  url: {
    required: true,
    trigger: ["blur", "input"],
    validator(rule: FormItemRule, value: string) {
      if (!value) {
        return new Error("请输入Jenkins URL");
      } else if (!urlRegexUtil.test(value)) {
        return new Error("请输入正确的Url地址");
      }
      return true;
    },
  },
  username: {
    required: true,
    trigger: ["blur", "input"],
    message: "请输入Jenkins用户名",
  },
  token: {
    required: true,
    trigger: ["blur", "input"],
    message: "请输入Jenkins Token",
  },
};

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
  name: "Account",
  components: { HelpFilled },
  computed: {},
  setup() {
    const store = useStore();
    const showModalRef = ref(false);
    const formRef = ref<FormInst | null>(null);
    const message = useMessage();
    const dialog = useDialog();
    const testLoading = ref(false);
    let modelRef = ref(initModel());
    let dataList = ref<any>(getConfList());

    const addConfigModel = () => {
      showModalRef.value = true;
    };

    const handleSaveConfig = () => {
      formRef.value?.validate((errors) => {
        if (!errors) {
          let config: any = {
            _id: modelRef.value._id || "",
            data: {
              name: modelRef.value.name,
              url: modelRef.value.url,
              username: modelRef.value.username,
              token: modelRef.value.token,
            },
            _rev: modelRef.value._rev,
          };

          if (!config._id) {
            config._id = "jenkins-" + utils.uuid();
          }

          config._rev || delete config._rev;

          const result = utools.db.put(config);
          if (!result.ok) {
            message.error("保存失败");
            return;
          }

          dataList.value = getConfList();

          message.success("保存成功");

          modelRef.value = initModel();

          showModalRef.value = false;
        } else {
          console.error(errors);
          message.error("验证失败");
        }
      });
    };

    const editConfig = (rowData: any) => {
      modelRef.value = {
        _id: rowData._id,
        name: rowData.data.name,
        url: rowData.data.url,
        username: rowData.data.username,
        token: rowData.data.token,
        _rev: rowData._rev,
      } as any;

      showModalRef.value = true;
    };

    const deleteConfig = (rowData: any) => {
      dialog.warning({
        title: "温馨提示",
        content: "您确定要删除，" + rowData.data.name + "任务吗？",
        positiveText: "确定",
        onPositiveClick: () => {
          const result = utools.db.remove(rowData._id);
          if (result.ok) {
            dataList.value = getConfList();
            message.success("删除成功");
          } else {
            message.error("删除失败！");
          }
        },
      });
    };

    const handleCloseModel = () => {
      modelRef.value = initModel();
    };

    const handleTestConnect = () => {
      testLoading.value = true;
      formRef.value?.validate((errors) => {
        if (!errors) {
          const config: any = {
            url: modelRef.value.url,
            username: modelRef.value.username,
            token: modelRef.value.token,
          };

          store
            .dispatch("baseInfoAct", config)
            .then((res) => {
              testLoading.value = false;
              if (res._class === "hudson.model.Hudson") {
                message.success("成功");
              } else {
                message.error("无法连接！");
              }
            })
            .catch((err) => {
              testLoading.value = false;
              message.error("无法连接！");
            });
        } else {
          testLoading.value = false;
          message.error("验证失败");
        }
      });
    };

    return {
      formRef,
      showEditModal: showModalRef,
      data: dataList,
      columns: createColumns({ editConfig }, { deleteConfig }),
      addConfigModel,
      handleSaveConfig,
      model: modelRef,
      rules,
      size: ref("medium"),
      handleCloseModel,
      handleTestConnect,
      testLoading,
    };
  },
});
</script>

<template>
  <div class="btn-wapper">
    <n-button type="primary" @click="addConfigModel">新增配置</n-button>
  </div>

  <n-data-table :columns="columns" :data="data" />

  <n-modal
    v-model:show="showEditModal"
    preset="dialog"
    title="Dialog"
    positive-text="保存"
    @positive-click="handleSaveConfig"
    @close="handleCloseModel"
    :close-on-esc="false"
    :mask-closable="false"
    :showIcon="false"
    style="width: 600px"
  >
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
          maxWidth: '740px',
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
        <n-form-item path="token">
          <template #label>
            Token
            <n-popover trigger="hover">
              <template #trigger>
                <n-icon size="15" color="#a19f9d">
                  <help-filled />
                </n-icon>
              </template>
              <div class="token-help">
                <h3>如何获取Token:</h3>
                <h4>第一步:</h4>
                <img width="420" src="@/assets/jenkins-1.png" />
                <h4>第二步:</h4>
                <img width="420" src="@/assets/jenkins-2.png" />
              </div>
            </n-popover>
          </template>
          <n-input
            v-model:value="model.token"
            type="password"
            show-password-on="mousedown"
            placeholder="令牌"
          />
        </n-form-item>
      </n-form>
    </div>
    <template #action>
      <div style="height: 50px"></div>
      <n-button :loading="testLoading" @click="handleTestConnect"
        >测试</n-button
      >
      <n-button type="primary" @click="handleSaveConfig">保存</n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.btn-wapper {
  margin-bottom: 10px;
  text-align: right;
}
.token-help {
  max-height: 200px;
  overflow-y: auto;
}
</style>