import { reactive } from "vue";

export interface ListItem {
  id?: string;
  avatar?: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
  channel?: number;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
  emptyText: string;
}

const staticTabs = {
  notice: {
    key: "1",
    name: "通知",
    list: [] as ListItem[],
    emptyText: "暂无通知"
  },
  message: {
    key: "2",
    name: "消息",
    list: [] as ListItem[],
    emptyText: "暂无消息"
  }
};

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const noticesData = reactive<TabItem[]>([
  deepClone(staticTabs.notice),
  deepClone(staticTabs.message)
]);

export const setNotifications = (items: ListItem[]) => {
  const noticeTab = noticesData.find(v => v.key === "1");
  const messageTab = noticesData.find(v => v.key === "2");
  if (noticeTab) noticeTab.list = items.filter(v => v.channel !== 4);
  if (messageTab) messageTab.list = items.filter(v => v.channel === 4);
};

export const removeNotification = (id: string) => {
  noticesData.forEach(tab => {
    tab.list = tab.list.filter(item => item.id !== id);
  });
};
