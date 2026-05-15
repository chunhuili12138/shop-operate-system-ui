// 这里存放本地图标，在 src/layout/index.vue 文件中加载，避免在首启动加载
import { getSvgInfo } from "@pureadmin/utils";
import { addIcon } from "@iconify/vue/dist/offline";

// ===== Element Plus Icons =====
import EpHomeFilled from "~icons/ep/home-filled?raw";
import EpSetting from "~icons/ep/setting?raw";
import EpList from "~icons/ep/list?raw";
import EpUser from "~icons/ep/user?raw";
import EpGoods from "~icons/ep/goods?raw";
import EpBox from "~icons/ep/box?raw";
import EpPresent from "~icons/ep/present?raw";
import EpMoney from "~icons/ep/money?raw";
import EpDataAnalysis from "~icons/ep/data-analysis?raw";
import EpTrendCharts from "~icons/ep/trend-charts?raw";

// ===== Remix Icons =====
import RiSearchLine from "~icons/ri/search-line?raw";
import RiInformationLine from "~icons/ri/information-line?raw";
import RiBookOpenLine from "~icons/ri/book-open-line?raw";
import RiStore2Line from "~icons/ri/store-2-line?raw";
import RiExchangeDollarLine from "~icons/ri/exchange-dollar-line?raw";
import RiShoppingCart2Line from "~icons/ri/shopping-cart-2-line?raw";
import RiCheckboxCircleLine from "~icons/ri/checkbox-circle-line?raw";
import RiRefund2Line from "~icons/ri/refund-2-line?raw";
import RiFlaskLine from "~icons/ri/flask-line?raw";
import RiShoppingBagLine from "~icons/ri/shopping-bag-line?raw";
import RiCoupon2Line from "~icons/ri/coupon-2-line?raw";
import RiArticleLine from "~icons/ri/article-line?raw";
import RiMoneyDollarCircleLine from "~icons/ri/money-dollar-circle-line?raw";
import RiMoneyCnyCircleLine from "~icons/ri/money-cny-circle-line?raw";
import RiPercentLine from "~icons/ri/percent-line?raw";
import RiBillLine from "~icons/ri/bill-line?raw";
import RiNotification3Line from "~icons/ri/notification-3-line?raw";
import RiFileChartLine from "~icons/ri/file-chart-line?raw";
import RiVipCrownLine from "~icons/ri/vip-crown-line?raw";
import RiAdminLine from "~icons/ri/admin-line?raw";
import RiShieldCheckLine from "~icons/ri/shield-check-line?raw";

const icons = [
  // Element Plus Icons
  ["ep/home-filled", EpHomeFilled],
  ["ep/setting", EpSetting],
  ["ep/list", EpList],
  ["ep/user", EpUser],
  ["ep/goods", EpGoods],
  ["ep/box", EpBox],
  ["ep/present", EpPresent],
  ["ep/money", EpMoney],
  ["ep/data-analysis", EpDataAnalysis],
  ["ep/trend-charts", EpTrendCharts],
  // Remix Icons
  ["ri/search-line", RiSearchLine],
  ["ri/information-line", RiInformationLine],
  ["ri/book-open-line", RiBookOpenLine],
  ["ri/store-2-line", RiStore2Line],
  ["ri/exchange-dollar-line", RiExchangeDollarLine],
  ["ri/shopping-cart-2-line", RiShoppingCart2Line],
  ["ri/checkbox-circle-line", RiCheckboxCircleLine],
  ["ri/refund-2-line", RiRefund2Line],
  ["ri/flask-line", RiFlaskLine],
  ["ri/shopping-bag-line", RiShoppingBagLine],
  ["ri/coupon-2-line", RiCoupon2Line],
  ["ri/article-line", RiArticleLine],
  ["ri/money-dollar-circle-line", RiMoneyDollarCircleLine],
  ["ri/money-cny-circle-line", RiMoneyCnyCircleLine],
  ["ri/percent-line", RiPercentLine],
  ["ri/bill-line", RiBillLine],
  ["ri/notification-3-line", RiNotification3Line],
  ["ri/file-chart-line", RiFileChartLine],
  ["ri/vip-crown-line", RiVipCrownLine],
  ["ri/admin-line", RiAdminLine],
  ["ri/shield-check-line", RiShieldCheckLine],
];

// 本地菜单图标，后端在路由的 icon 中返回对应的图标字符串并且前端在此处使用 addIcon 添加即可渲染菜单图标
icons.forEach(([name, icon]) => {
  addIcon(name as string, getSvgInfo(icon as string));
});
