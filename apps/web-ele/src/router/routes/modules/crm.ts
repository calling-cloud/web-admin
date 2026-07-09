import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:briefcase-business',
      order: 1,
      title: '业务管理',
    },
    name: 'Crm',
    path: '/crm',
    children: [
      {
        component: () => import('#/views/crm/list.vue'),
        meta: {
          crmModule: 'customers',
          icon: 'lucide:users',
          title: '客户管理',
        },
        name: 'CrmCustomers',
        path: 'customers',
      },
      {
        component: () => import('#/views/crm/list.vue'),
        meta: {
          crmModule: 'schools',
          icon: 'lucide:school',
          title: '学校管理',
        },
        name: 'CrmSchools',
        path: 'schools',
      },
      {
        component: () => import('#/views/crm/list.vue'),
        meta: {
          crmModule: 'teams',
          icon: 'lucide:network',
          title: '团队管理',
        },
        name: 'CrmTeams',
        path: 'teams',
      },
      {
        component: () => import('#/views/crm/list.vue'),
        meta: {
          crmModule: 'employees',
          icon: 'lucide:user-round-cog',
          title: '员工管理',
        },
        name: 'CrmEmployees',
        path: 'employees',
      },
    ],
  },
  {
    component: () => import('#/views/crm/settings.vue'),
    meta: {
      icon: 'lucide:settings',
      order: 2,
      title: '系统设置',
    },
    name: 'CrmSettings',
    path: '/settings',
  },
];

export default routes;
