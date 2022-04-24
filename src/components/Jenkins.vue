<script lang="ts">
import { NButton, NIcon } from "naive-ui";
import { Construct as ConstructIcon } from '@vicons/ionicons5'
import { ChangeCatalog } from '@vicons/carbon'
import { h, defineComponent, ref } from "vue";

const jenkins = [
  {
    label: "Jenkins1",
    value: "j1",
    disabled: true,
  },
  {
    label: "Jenkins2",
    value: "j2",
  },
];

const screens = [
  {
    label: "all",
    value: "0",
    disabled: true,
  },
  {
    label: "基本",
    value: "1",
  },
];

const createColumns = ({ buildJob }:{ buildJob: (row: any) => void},{ viewLog }:{ viewLog: (row: any) => void}) => {
  return [
    {
      title: "状态",
      key: "status",
      width: 80,
      fixed: "left",
    },
    {
      title: "名称",
      key: "name",
      width: 100,
      fixed: "left",
    },
    {
      title: "构建时间",
      key: "row",
      render(row: any, index: number) {
        return h("span", ["row ", index]);
      },
    },
    {
      title: "操作",
      key: "operation",
      width: 200,
      fixed: "right",
      render(row: any) {
        const ops = [
            h(NButton, {
                strong: true,
                secondary: true,
                circle: true,
                type: "success",
                title: "构建",
                onClick: () => buildJob(row)
            },
            {
                icon: () => h(NIcon, {
                    component: ConstructIcon
                })
            }
          ),

          h(NButton, {
                strong: true,
                secondary: true,
                circle: true,
                type: "success",
                title: "查看日志",
                style: {
                    marginLeft: '10px'
                },
                onClick: () => viewLog(row)
          },
          {
              icon: () => h(NIcon , {
                  component: ChangeCatalog
              })
          }
          )
        ];
        return ops;
      },
    },
  ];
};

export default defineComponent({
  name: "Jenkins",
  setup() {

    const buildJob = (rowData: any) => {
        console.log("构建-----------------");
        
    }

    const viewLog = (rowData: any) => {
        console.log("查看日志-------------------");
        
    }

    return {
      jkName: ref(null),
      screen: ref(null),
      jobName: ref(null),
      jenkins,
      screens,
      data: Array.apply(null, Array(46)).map((_, index) => ({
        status: index,
        name: `Job ${index}`,
        // age: 32,
        // address: `London, Park Lane no. ${index}`
      })),
      columns: createColumns({
          buildJob
      },{
          viewLog
      }),
    };
  },
});
</script>

<template>
  <n-grid x-gap="12" :cols="4">
    <n-gi>
      <n-select v-model:value="jkName" :options="jenkins" />
    </n-gi>
    <n-gi>
      <n-select v-model:value="screen" :options="screens" />
    </n-gi>
    <n-gi>
      <n-input v-model:value="jobName" type="text" placeholder="任务名称" />
    </n-gi>
    <n-gi>
      <n-button type="success">刷新列表</n-button>
    </n-gi>
  </n-grid>
  <n-data-table
    :columns="columns"
    :data="data"
    :scroll-x="1200"
    class="data-table"
  />
</template>

<style scoped>
.data-table {
  margin-top: 10px;
}
</style>