const Layout = () => import("@/layout/index.vue");

export default {
  path: "/admin",
  name: "AdminPosture",
  component: Layout,
  redirect: "/admin/questions",
  meta: {
    icon: "ep/setting",
    title: "管理端",
    rank: 3
  },
  children: [
    {
      path: "/admin/questions",
      name: "AdminQuestions",
      component: () => import("@/views/admin/questions/index.vue"),
      meta: {
        title: "题库管理"
      }
    },
    {
      path: "/admin/actions",
      name: "AdminActions",
      component: () => import("@/views/admin/actions/index.vue"),
      meta: {
        title: "动作管理"
      }
    },
    {
      path: "/admin/rules",
      name: "AdminRules",
      component: () => import("@/views/admin/rules/index.vue"),
      meta: {
        title: "规则管理"
      }
    },
    {
      path: "/admin/settings",
      name: "AdminSettings",
      component: () => import("@/views/admin/settings/index.vue"),
      meta: {
        title: "系统设置"
      }
    }
  ]
} satisfies RouteConfigsTable;
