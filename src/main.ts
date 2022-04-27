import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import {
    // create naive ui
    create,
    // component
    NButton,
    NTabs,
    NTabPane,
    NForm,
    NFormItem,
    NInput,
    NGrid,
    NGi,
    NSelect,
    NDataTable,
    NIcon,
    NModal,
    NTime,
    NLog,
    NConfigProvider,
    NDialogProvider,
    NMessageProvider
} from 'naive-ui'

const naive = create({
    components: [
        NButton,
        NTabs,
        NTabPane,
        NForm,
        NFormItem,
        NInput,
        NGrid,
        NGi,
        NSelect,
        NDataTable,
        NIcon,
        NModal,
        NTime,
        NLog,
        NConfigProvider,
        NDialogProvider,
        NMessageProvider
    ]
})

createApp(App)
.use(store)
.use(naive)
.mount('#app')
