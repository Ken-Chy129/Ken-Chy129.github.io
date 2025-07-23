import {SidebarConfig4Multiple} from "vuepress/config";

import roadmapSideBar from "./sidebars/roadmapSideBar";
import javaSideBar from "./sidebars/javaSideBar";
import goSideBar from "./sidebars/goSideBar";

// @ts-ignore
export default {
    "/学习路线/": roadmapSideBar,
    "/Java/": javaSideBar,
    "/Go/": goSideBar,
    // 降级，默认根据文章标题渲染侧边栏
    "/": "auto",
} as SidebarConfig4Multiple;
