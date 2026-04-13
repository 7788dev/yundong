const Layout = () => import("@/layout/index.vue");

export default {
  path: "/u",
  name: "UserPosture",
  component: Layout,
  redirect: "/u/assessment",
  meta: {
    icon: "ep/user",
    title: "用户端",
    rank: 2
  },
  children: [
    {
      path: "/u/assessment",
      name: "UserAssessment",
      component: () => import("@/views/user/assessment/index.vue"),
      meta: {
        title: "体态评估"
      }
    },
    {
      path: "/u/result/:id",
      name: "UserResult",
      component: () => import("@/views/user/result/index.vue"),
      meta: {
        title: "评估结果",
        showLink: false
      }
    },
    {
      path: "/u/plan/:id",
      name: "UserPlan",
      component: () => import("@/views/user/plan/index.vue"),
      meta: {
        title: "康复计划",
        showLink: false
      }
    },
    {
      path: "/u/reassess",
      name: "UserReassess",
      component: () => import("@/views/user/reassess/index.vue"),
      meta: {
        title: "复评对比"
      }
    }
  ]
} satisfies RouteConfigsTable;
