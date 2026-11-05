/* Orbit competition module data — based on GIS比赛.txt + official pages. */
window.ORBIT_COMPETITIONS = [
  {
    id: "esri",
    name: "易智瑞杯中国大学生 GIS 软件开发竞赛",
    short: "易智瑞杯",
    organizer: "中国测绘学会",
    host: "易智瑞信息技术有限公司",
    signup: "3—7 月（2026 年报名 3 月 16 日—4 月 15 日）",
    groups: ["地图故事组", "地理设计组", "GIS 应用开发组", "遥感应用组"],
    difficulty: "低",
    fit: "第一次参加 / 想完整做完一个作品",
    note: "地图故事组最适合头次参加；GIS 应用开发偏 WebGIS；作品提交多在暑假。1—4 名学生 + 0—2 名教师，可跨校跨专业组队。",
    tags: ["制图", "设计", "开发", "遥感"],
    url: "https://contest.geoscene.cn/",
    urlLabel: "大赛官网"
  },
  {
    id: "supermap",
    name: "SuperMap 杯高校 GIS 大赛",
    short: "SuperMap 杯",
    organizer: "中国地理学会、中国地理信息产业协会",
    host: "北京超图软件股份有限公司",
    signup: "3—7 月",
    groups: ["制图组", "分析组", "命题开发组", "开发组"],
    difficulty: "高",
    fit: "有基础 / 想冲高难度作品",
    note: "整体难度高，适合已有 GIS 基础、愿意投入较长时间打磨作品的队伍；开发组对 WebGIS/后端能力要求更高。",
    tags: ["制图", "分析", "开发"],
    url: "http://www.giscontest.com/",
    urlLabel: "大赛官网"
  },
  {
    id: "kq",
    name: "“苍穹杯”全国大学生空间信息技术大赛",
    short: "苍穹杯",
    organizer: "中国测绘学会",
    host: "苍穹数码技术股份有限公司",
    signup: "3—8 月",
    groups: ["制图组", "设计组", "论文组", "应用开发组"],
    difficulty: "中",
    fit: "想练国产 GIS / 做完整作品",
    note: "难度适中，基于国产 KQGIS 平台；适合想了解国产 GIS 软件、做制图/设计/论文/开发作品的队伍。",
    tags: ["制图", "设计", "论文", "开发", "国产 GIS"],
    url: "https://www.kqgeo.com/",
    urlLabel: "苍穹数码官网"
  },
  {
    id: "mapgis",
    name: "全国高校 GIS 技能大赛",
    short: "MapGIS 技能大赛",
    organizer: "中国测绘学会、中国地理信息产业协会",
    host: "中地数码集团",
    signup: "4—8 月",
    groups: ["操作组", "论文组", "开发组"],
    difficulty: "中",
    fit: "想练 MapGIS 操作 / 开发",
    note: "难度适中，覆盖操作、论文、开发三个方向；适合系统练国产 MapGIS 软件和空间分析流程。",
    tags: ["操作", "论文", "开发", "国产 GIS"],
    url: "http://contest.gisera.com/",
    urlLabel: "大赛官网"
  },
  {
    id: "cagis",
    name: "高校大学生 GIS 应用技能大赛",
    short: "GIS 应用技能大赛",
    organizer: "中国地理信息产业协会、中国地理学会",
    host: "中国地理信息产业协会教育工作委员会 + 承办高校",
    signup: "一般年底（各校选拔）",
    groups: ["应用技能团体赛"],
    difficulty: "低",
    fit: "想和团队一起练综合应用",
    note: "每个学校通常限 1 组，学生不超过 4 人；比赛时间短、出奖快，适合作为团队综合训练。",
    tags: ["应用", "团队", "综合"],
    url: "https://www.cagis.org.cn/",
    urlLabel: "协会通知"
  },
  {
    id: "ciia",
    name: "地理信息技术与应用技能大赛",
    short: "地理信息技能赛",
    organizer: "中国信息协会",
    host: "易智瑞等承办 / 执行单位",
    signup: "2—5 月",
    groups: ["个人赛", "团体赛"],
    difficulty: "低",
    fit: "想练软件操作 / 拿一个比赛经历",
    note: "分个人赛和团体赛，整体门槛较低；可作为 GIS 软件操作和项目经历的练手，是否认定看学校政策。",
    tags: ["个人", "团体", "操作"],
    url: "http://gislevel.geoscene.cn/",
    urlLabel: "赛事官网"
  }
];

window.ORBIT_SKILLS = [
  {
    title: "GIS 基础与空间分析",
    level: "所有比赛",
    learn: "矢量/栅格、投影、拓扑、缓冲区、叠加、网络分析、DEM",
    use: "分析报告、实验题、作品的技术底层",
    href: "arcgis.html",
    hrefLabel: "ArcGIS 模块"
  },
  {
    title: "地图制图与叙事",
    level: "制图 / 设计组",
    learn: "版式、色彩、图例、比例尺、地图故事、版面叙事",
    use: "地图故事、制图组、地理设计组",
    href: "ebook.html",
    hrefLabel: "制图参考"
  },
  {
    title: "数据处理与坐标系统",
    level: "所有比赛",
    learn: "数据格式、投影转换、配准、裁剪、融合、质量检查",
    use: "所有作品的准备阶段",
    href: "arcgis.html#resources",
    hrefLabel: "操作资料"
  },
  {
    title: "WebGIS 前端",
    level: "开发组",
    learn: "HTML/CSS/JS、Leaflet、OpenLayers、地图交互、GeoJSON",
    use: "GIS 应用开发、WebGIS 作品",
    href: "https://openlayers.org/",
    hrefLabel: "OpenLayers"
  },
  {
    title: "后端、数据库与部署",
    level: "开发组",
    learn: "PostGIS、GeoServer、接口设计、服务器部署、权限",
    use: "可交互的 WebGIS 系统",
    href: "https://postgis.net/",
    hrefLabel: "PostGIS"
  },
  {
    title: "Python 地理处理",
    level: "分析 / 开发组",
    learn: "Python、pandas、GeoPandas、GDAL、Matplotlib、自动化",
    use: "批量处理、空间分析、图表与可复现流程",
    href: "python.html",
    hrefLabel: "Python 模块"
  },
  {
    title: "遥感与影像分析",
    level: "遥感组",
    learn: "影像预处理、NDVI、分类、变化检测、ENVI/GEE/SNAP",
    use: "遥感应用组、生态环境类作品",
    href: "remote.html",
    hrefLabel: "遥感模块"
  },
  {
    title: "论文写作与答辩",
    level: "论文 / 所有组",
    learn: "问题—方法—结果—讨论、图表规范、答辩表达",
    use: "论文组、作品说明书、最终答辩",
    href: "#resources",
    hrefLabel: "资料库"
  }
];

window.ORBIT_RESOURCES = [
  ["官方文档", "ArcGIS Pro 文档", "制图、分析、三维、模型构建器", "https://pro.arcgis.com/zh-cn/pro-app/latest/get-started/get-started.htm"],
  ["官方文档", "SuperMap 帮助文档", "iDesktopX / iServer / WebGIS", "https://help.supermap.com/"],
  ["官方文档", "MapGIS 官网", "MapGIS 桌面与服务", "https://www.mapgis.com/"],
  ["官方文档", "QGIS 文档", "开源 GIS 全套操作", "https://docs.qgis.org/"],
  ["WebGIS", "OpenLayers", "开源 Web 地图引擎", "https://openlayers.org/"],
  ["WebGIS", "Leaflet", "轻量 Web 地图库", "https://leafletjs.com/"],
  ["WebGIS", "Turf.js", "浏览器端空间分析", "https://turfjs.org/"],
  ["数据科学", "GeoPandas", "Python 矢量数据处理", "https://geopandas.org/"],
  ["数据科学", "GDAL", "栅格/矢量格式转换", "https://gdal.org/"],
  ["数据源", "地理空间数据云", "国内遥感/地理数据", "https://www.gscloud.cn/"],
  ["数据源", "USGS EarthExplorer", "Landsat / 遥感影像", "https://earthexplorer.usgs.gov/"],
  ["数据源", "Copernicus Data Space", "Sentinel 系列", "https://dataspace.copernicus.eu/"],
  ["底图", "OpenStreetMap", "开放街道地图", "https://www.openstreetmap.org/"],
  ["底图", "Natural Earth", "全球自然/人文底图", "https://www.naturalearthdata.com/"]
];

window.ORBIT_PREP = [
  {
    key: "map",
    title: "制图 / 设计路线",
    fit: "第一次参赛、喜欢视觉表达",
    steps: ["先学地图版式与配色", "用 ArcGIS/QGIS 做一张完整专题图", "选一个真实主题写地图故事", "按比赛模板排版、补说明"],
    first: "易智瑞地图故事组 / 苍穹制图组"
  },
  {
    key: "dev",
    title: "开发 / WebGIS 路线",
    fit: "会一点编程、想做可交互系统",
    steps: ["HTML/CSS/JS + 地图库", "GeoJSON/瓦片/接口", "做一个最小可用的 WebGIS", "补后端/数据库/部署"],
    first: "易智瑞 GIS 应用开发组 / SuperMap 开发组"
  },
  {
    key: "analysis",
    title: "遥感 / 分析路线",
    fit: "喜欢影像、空间分析与报告",
    steps: ["影像预处理与增强", "NDVI/分类/变化检测", "空间统计与制图", "写成问题—方法—结果报告"],
    first: "易智瑞遥感应用组 / 苍穹论文组"
  }
];
