const Layout = () => import("@/layout/index.vue");

export default {
  path: "/my",
  name: "My",
  component: Layout,
  redirect: "/my/profile",
  meta: {
    title: "个人中心",
    showLink: false
  },
  children: [
    {
      path: "/my/profile",
      name: "MyProfile",
      component: () => import("@/views/my/profile/index.vue"),
      meta: {
        title: "个人中心",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
