<script lang="ts">
import {
  h,
  defineComponent,
  ref,
  watch,
  reactive,
  nextTick,
  computed,
} from "vue";
import {
  FormInst,
  NButton,
  NIcon,
  useMessage,
  useDialog,
  FormItemRule,
  NAvatar,
  FormRules,
  NTag,
  DataTableColumns,
} from "naive-ui";
import { Edit, Delete, HelpFilled } from "@vicons/carbon";
import { useStore } from "vuex";
import { urlRegexUtil } from "@/utils/regex";
import {
  GitPlatformEnum,
  IGitPlatformAccount,
  IUtoolsGitAccount,
} from "./model";

const rules: FormRules = {
  host: {
    required: true,
    trigger: ["blur", "input"],
    validator(rule: FormItemRule, value: string) {
      if (!value) {
        return new Error("请输入仓库平台 URL");
      } else if (!urlRegexUtil.test(value)) {
        return new Error("请输入正确的 URL 地址");
      }
      return true;
    },
  },
  token: {
    required: true,
    trigger: ["blur", "input"],
    message: "请输入Token",
  },
};

const utools = window.utools;
const GITLAB_ACCOUNT_DB_KEY = "gitlab-account";
const GITEE_ACCOUNT_DB_KEY = "gitee-account";

const getAccountFromUtools = (platform: string): IUtoolsGitAccount => {
  let account;
  switch (platform) {
    case GitPlatformEnum.GIT_LAB:
      account = utools.db.get(GITLAB_ACCOUNT_DB_KEY);
    case GitPlatformEnum.GITEE:
      account = utools.db.get(GITLAB_ACCOUNT_DB_KEY);
  }

  if (!!account) {
    return { ...account };
  }
  console.log("getAccountFromUtools", account);
  // default
  return defaultAccount(GITLAB_ACCOUNT_DB_KEY);
};

const defaultAccount = (key: string): IUtoolsGitAccount => {
  return {
    _id: key,
    data: {
      host: "",
      token: "",
      username: "",
      avatarUrl: "",
      platform: GitPlatformEnum.GIT_LAB,
    },
  };
};

type RowData = {
  key: number;
  name: string;
  age: number;
  address: string;
  tags: string[];
};
const createColumns = ({
  sendMail,
}: {
  sendMail: (rowData: RowData) => void;
}): DataTableColumns<RowData> => {
  return [
    {
      title: "Name",
      key: "name",
    },
    {
      title: "Age",
      key: "age",
    },
    {
      title: "Address",
      key: "address",
    },
    {
      title: "Tags",
      key: "tags",
      render(row) {
        const tags = row.tags.map((tagKey) => {
          return h(
            NTag,
            {
              style: {
                marginRight: "6px",
              },
              type: "info",
              bordered: false,
            },
            {
              default: () => tagKey,
            }
          );
        });
        return tags;
      },
    },
    {
      title: "Action",
      key: "actions",
      render(row) {
        return h(
          NButton,
          {
            size: "small",
            onClick: () => sendMail(row),
          },
          { default: () => "Send Email" }
        );
      },
    },
  ];
};

const createData = (): RowData[] => [
  {
    key: 0,
    name: "John Brown",
    age: 32,
    address: "New York No. 1 Lake Park",
    tags: ["nice", "developer"],
  },
  {
    key: 1,
    name: "Jim Green",
    age: 42,
    address: "London No. 1 Lake Park",
    tags: ["wow"],
  },
  {
    key: 2,
    name: "Joe Black",
    age: 32,
    address: "Sidney No. 1 Lake Park",
    tags: ["cool", "teacher"],
  },
];

export default defineComponent({
  name: "Repository",
  components: { HelpFilled, NAvatar },
  computed: {},
  setup() {
    const store = useStore();
    const formRef = ref<FormInst | null>(null);
    const message = useMessage();
    const testLoading = ref<boolean>(false);
    let formValue = ref<IUtoolsGitAccount>(
      getAccountFromUtools(GitPlatformEnum.GIT_LAB)
    );
    let currentAccount = reactive<IGitPlatformAccount>({
      ...getAccountFromUtools(GitPlatformEnum.GIT_LAB).data,
    });
    const showAccountEditModal = ref<boolean>(false);

    // 点击头像弹出账号信息编辑框
    const editLoginAccount = () => {
      showAccountEditModal.value = true;
      console.log("currentAccount====", currentAccount);
    };

    // 登录测试
    const handleTestLogin = () => {
      testLoading.value = true;
      formRef.value?.validate(async (errors) => {
        if (!errors) {
          // TODO 不知道是不是异步请求的原因导致数据好像没双向绑定的样子，造成avatar没有重新渲染
          // 暂时用setTimeout可以解决
          await store
            .dispatch("gitAccountAct", formValue.value.data)
            .then((res) =>
              setTimeout(() => {
                testLoading.value = false;
                if (res.status === 200) {
                  message.success("成功");
                  currentAccount = res.data;
                  formValue.value.data = res.data;
                } else {
                  message.error("无法连接！");
                }
              }, 500)
            )
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

    // 模态框图标渲染函数
    const dialogIconRender = () => {
      return h(NAvatar, {
        round: true,
        size: "small",
        src: currentAccount.avatarUrl,
      });
    };

    // 模态框标题渲染函数
    const dialogTitleRender = () => {
      return h("p", currentAccount.username);
    };

    // 保存账号信息
    const handleSaveConfig = () => {
      formRef.value?.validate(
        (errors) => {
          if (!errors) {
            try {
              let dbData: IUtoolsGitAccount = {
                _id: formValue.value._id || "",
                data: {
                  ...formValue.value.data,
                },
                _rev: formValue.value._rev,
              };
              //首次初始化的时候需要删除这个字段
              dbData._rev || delete dbData._rev;
              console.error("dbData", dbData);
              utools.db.put(dbData);
            } catch (err) {
              console.error("[handleSaveConfig] ==> fail reason ==>", err);
              message.success("保存失败");
              return;
            }
            message.success("保存成功");
            showAccountEditModal.value = false;
          } else {
            console.log(errors);
            message.error("验证失败");
          }
        },
        // 校验部分
        (rule) => {
          return rule?.key === "a";
        }
      );
    };

    // 查询git项目
    const listProject = (account: IGitPlatformAccount) => {
        store.dispatch("gitProjectsAct", account).then(res => {
            console.log(res, "vvvvvvvvvvvvvvvvv")
        })
    }

    return {
      currentAccount,
      editLoginAccount,
      showAccountEditModal,
      formValue,
      formRef,
      handleSaveConfig,
      rules,
      size: ref("medium"),
      handleTestLogin,
      testLoading,
      dialogIconRender,
      dialogTitleRender,
      listProject,
      data: createData(),
      columns: createColumns({
        sendMail(rowData) {
          message.info("send mail to " + rowData.name);
        },
      }),
      pagination: {
        pageSize: 10,
      },
    };
  },

  beforeMount() {
    if (!this.$store.getters.gitProjectsLoading) {
      const account = getAccountFromUtools(GitPlatformEnum.GIT_LAB).data
      this.$store.dispatch('gitAccountAct', account)
      this.listProject(account);
      this.$store.dispatch('gitProjectsLoadingAct', true)
    }
  },

  updated() {
    console.log("数据更新啦！！！");
  },
});
</script>

<template>
  <n-space justify="end" style="margin-top: -15px">
    <div class="avatar" @click="editLoginAccount">
      <n-avatar v-if="!currentAccount.avatarUrl" round :size="48">
        登录
      </n-avatar>
      <n-avatar v-else round :size="48" :src="currentAccount.avatarUrl" />
    </div>
  </n-space>

  <!-- 登录模态框 -->
  <n-modal
    v-model:show="showAccountEditModal"
    preset="dialog"
    :title="dialogTitleRender"
    positive-text="保存"
    @positive-click="handleSaveConfig"
    :close-on-esc="false"
    :mask-closable="false"
    :showIcon="true"
    :icon="dialogIconRender"
    style="width: 600px"
  >
    <div>
      <n-form
        ref="formRef"
        :model="formValue.data"
        :rules="rules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
        :size="size"
        :style="{
          maxWidth: '740px',
        }"
      >
        <n-form-item label="GitLab Host" path="host">
          <n-input v-model:value="formValue.data.host" placeholder="输入 URL" />
        </n-form-item>
        <n-form-item path="token">
          <template #label>
            Access Token
            <n-popover trigger="hover">
              <template #trigger>
                <n-icon size="15" color="#a19f9d">
                  <help-filled />
                </n-icon>
              </template>
              <div class="token-help">
                <h3>如何获取Token:</h3>
                <h4>第一步:</h4>
                <img width="420" src="@/assets/gitlab-1.png" />
                <h4>第二步:</h4>
                <img width="420" src="@/assets/gitlab-2.png" />
              </div>
            </n-popover>
          </template>
          <n-input
            v-model:value="formValue.data.token"
            type="password"
            show-password-on="mousedown"
            placeholder="输入令牌"
          />
        </n-form-item>
      </n-form>
    </div>
    <template #action>
      <div style="height: 50px"></div>
      <n-button :loading="testLoading" @click="handleTestLogin">测试</n-button>
      <n-button type="primary" @click="handleSaveConfig">保存</n-button>
    </template>
  </n-modal>

  <!--  -->
  <n-data-table
    :bordered="false"
    :single-line="false"
    :columns="columns"
    :data="data"
    :pagination="pagination"
  />
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
