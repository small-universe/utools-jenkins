<template>
  <div class="jobs-list">
    <n-tabs class="card-tabs" default-value="jobs" size="large" animated
      pane-style="padding-top: 15px;padding-left: 4px; padding-right: 4px; box-sizing: border-box;">
      <n-tab-pane name="jobs" tab="Jenkins构建部署">
        <jenkins />
      </n-tab-pane>
      <n-tab-pane name="account" tab="Jenkins账号配置">
        <account />
      </n-tab-pane>
      <n-tab-pane name="repository" tab="GitLab仓库配置">
        <repository />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Jenkins from "@/components/jenkins/index.vue"; // @ is an alias to /src
import Account from "@/components/account/index.vue";
import Repository from "@/components/repository/index.vue";

@Options({
  components: {
    Jenkins,
    Account,
    Repository
  },
})
export default class HomeView extends Vue { }
</script>

<style scoped>
.n-tabs .n-tab-pane {
  padding: 0;
}

.card-tabs .n-tabs-nav--bar-type {
  padding-left: 4px;
}

.jobs-list {
  padding: 0 10px;
}
</style>
