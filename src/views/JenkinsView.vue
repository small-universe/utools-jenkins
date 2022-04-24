<template>
  <!-- <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld />
  </div> -->
  <div class="jobs-list">
    <n-tabs
      class="card-tabs"
      default-value="signin"
      size="large"
      animated
      pane-style="padding-top: 15px;padding-left: 4px; padding-right: 4px; box-sizing: border-box;">
      <n-tab-pane name="signin" tab="任务">
        <jenkins/>
      </n-tab-pane>
      <n-tab-pane name="signup" tab="配置">
        <config/>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Jenkins from "@/components/Jenkins.vue"; // @ is an alias to /src
import Config from "@/components/Config.vue";

@Options({
  components: {
    Jenkins,
    Config
  },
})
export default class HomeView extends Vue {}
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
