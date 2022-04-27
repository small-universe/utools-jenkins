<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :hljs="hljs">
    <n-message-provider>
      <n-dialog-provider>
        <jenkins-view/>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { zhCN, dateZhCN } from 'naive-ui'
import hljs from 'highlight.js/lib/common'
import JenkinsView from '@/views/JenkinsView.vue'

hljs.registerLanguage('naive-log', () => ({
    contains: [
      {
        className: 'number',
        begin: /\d+/
      }
    ]
}))

export default defineComponent({
  components: {
    JenkinsView
  },
  setup() {
    return {
      zhCN,
      dateZhCN,
      hljs
    }
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
}
</style>
