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

    const editLoginAccount = () => {
      showAccountEditModal.value = true;
      console.log("currentAccount====", currentAccount);
    };

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

    const dialogTitleRender = () => {
      return h('p',  currentAccount.username);
    };

    watch(currentAccount, (oldData, newData) => {
      console.log("currentAccount==watch==>", oldData, newData);
    });

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
      dialogTitleRender
    };
  },

  beforeMount() {},

  updated() {
    console.log("数据更新啦！！！");
  },
});
</script>

<template>
  <n-space justify="end">
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
                <!-- <img width="420" src="@/assets/gitlab-1.png" /> -->
                <h4>第二步:</h4>
                <!-- <img width="420" src="@/assets/gitlab-2.png" /> -->
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