import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {
    // create naive ui
    create,
    // component
    NButton,
    NTabs,
    NTabPane,
    NForm,
    NFormItemRow,
    NInput,
    NConfigProvider,
    NDialogProvider
} from 'naive-ui'

const naive = create({
    components: [
        NButton,
        NTabs,
        NTabPane,
        NForm,
        NFormItemRow,
        NInput,
        NConfigProvider,
        NDialogProvider
    ]
})

createApp(App)
.use(store)
.use(router)
.use(naive)
.mount('#app')
