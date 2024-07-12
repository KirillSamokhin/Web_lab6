import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    {path: '/', component: () => import('@/components/LoginPage.vue')},
    {path: '/brokers', component: () => import('@/components/BrokersPage.vue')},
    {path: '/trade', component: () => import('@/components/TradePage.vue')}
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router