import { reactive } from "vue";

export interface ListItem {
  avatar?: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
  emptyText: string;
}

const staticTabs = {
  notice: { key: "1", name: "通知", list: [] as ListItem[], emptyText: "暂无通知" },
  message: {
    key: "2",
    name: "消息",
    list: [
      {
        avatar: "https://xiaoxian521.github.io/hyperlink/svg/smile1.svg",
        title: "小铭 评论了你",
        description: "诚在于心,信在于行,诚信在于心行合一。",
        datetime: "今天",
        type: "2"
      },
      {
        avatar: "https://xiaoxian521.github.io/hyperlink/svg/smile2.svg",
        title: "李白 回复了你",
        description: "长风破浪会有时,直挂云帆济沧海。",
        datetime: "昨天",
        type: "2"
      },
      {
        avatar: "https://xiaoxian521.github.io/hyperlink/svg/smile5.svg",
        title: "标题",
        description:
          "请将鼠标移动到此处,以便测试超长的消息在此处将如何处理。",
        datetime: "时间",
        type: "2"
      }
    ],
    emptyText: "暂无消息"
  }
};

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const noticesData = reactive<TabItem[]>([
  deepClone(staticTabs.notice),
  deepClone(staticTabs.message)
]);

export const setNotifications = (items: ListItem[]) => {
  const tab = noticesData.find(v => v.key === "1");
  if (tab) tab.list = items;
};
