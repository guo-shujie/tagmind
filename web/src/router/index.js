import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'contents',
        name: 'ContentList',
        component: () => import('../views/ContentList.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'content/edit',
        name: 'ContentEdit',
        component: () => import('../views/ContentEdit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'content/:id',
        name: 'ContentDetail',
        component: () => import('../views/ContentDetail.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'tags',
        name: 'TagManage',
        component: () => import('../views/TagManage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router