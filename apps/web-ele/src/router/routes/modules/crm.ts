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
        component: () => import('#/views/crm/list/index.vue'),
        meta: {
          crmModule: 'customers',
          icon: 'lucide:users',
          title: '客户管理',
        },
        name: 'CrmCustomers',
        path: 'customers',
      },
      {
        component: () => import('#/views/crm/list/index.vue'),
        meta: {
          crmModule: 'call-records',
          icon: 'lucide:phone-call',
          title: '通话记录',
        },
        name: 'CrmCallRecords',
        path: 'call-records',
      },
      {
        component: () => import('#/views/crm/list/index.vue'),
        meta: {
          crmModule: 'schools',
          icon: 'lucide:school',
          title: '学校管理',
        },
        name: 'CrmSchools',
        path: 'schools',
      },
      {
        component: () => import('#/views/crm/list/index.vue'),
        meta: {
          crmModule: 'teams',
          icon: 'lucide:network',
          title: '团队管理',
        },
        name: 'CrmTeams',
        path: 'teams',
      },
      {
        component: () => import('#/views/crm/list/index.vue'),
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
    component: () => import('#/views/crm/settings/index.vue'),
    meta: {
      icon: 'lucide:settings',
      order: 2,
      title: '系统配置',
    },
    name: 'CrmSettings',
    path: '/settings',
  },
  {
    meta: {
      icon: 'lucide:shield',
      order: 3,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        component: () => import('#/views/crm/list/index.vue'),
        meta: {
          crmModule: 'roles',
          icon: 'lucide:shield-check',
          title: '角色管理',
        },
        name: 'SystemRoles',
        path: 'roles',
      },
      {
        component: () => import('#/views/crm/list/index.vue'),
        meta: {
          crmModule: 'menus',
          icon: 'lucide:menu',
          title: '菜单管理',
        },
        name: 'SystemMenus',
        path: 'menus',
      },
    ],
  },
];

export default routes;
