# 个人学术主页

这是一个简洁现代的个人学术主页模板，使用HTML、CSS和JavaScript构建。

## 项目结构

```
.
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── main.js        # JavaScript脚本
└── assets/
    └── images/        # 图片资源目录
        ├── profile.jpg
        ├── research1.jpg
        └── research2.jpg
```

## 功能特点

- 响应式设计，适配各种设备
- 模块化结构，易于维护和扩展
- 现代化的视觉效果和交互
- 支持动态加载内容
- 平滑滚动和渐入动画效果

## 如何使用

1. 克隆或下载此仓库
2. 修改 `index.html` 中的个人信息
3. 在 `js/main.js` 中更新研究项目和发表文章数据
4. 在 `assets/images/` 目录中替换图片资源

### 修改内容

#### 个人信息
编辑 `index.html` 文件中的相关部分：
- 更新标题和简介
- 修改导航栏链接
- 更新联系方式

#### 研究项目
在 `js/main.js` 中编辑 `researchProjects` 数组：
```javascript
const researchProjects = [
    {
        title: '项目标题',
        description: '项目描述',
        image: 'assets/images/项目图片.jpg'
    }
];
```

#### 发表文章
在 `js/main.js` 中编辑 `publications` 数组：
```javascript
const publications = [
    {
        title: '论文标题',
        authors: '作者列表',
        journal: '期刊名称',
        year: '发表年份',
        link: '论文链接'
    }
];
```

## 图片命名规范

- 个人照片：`profile.jpg`
- 研究项目图片：`research1.jpg`, `research2.jpg` 等
- 建议使用统一的图片格式（jpg/png）和合适的分辨率

## 自定义样式

可以通过修改 `css/style.css` 文件来自定义网站样式：
- 颜色主题：修改 `:root` 中的变量
- 布局：调整 `container` 和各个部分的样式
- 响应式设计：修改 `@media` 查询中的样式

## 部署

1. 将所有文件上传到您的Web服务器
2. 确保所有文件保持正确的目录结构
3. 访问 index.html 查看网站

## 注意事项

- 保持图片大小适中，避免影响加载速度
- 定期更新内容保持网站活力
- 确保所有链接都是有效的
- 测试不同设备上的显示效果

## 技术支持

如果您在使用过程中遇到任何问题，请参考以下资源：
- 查看源代码注释
- 参考 HTML5/CSS3/JavaScript 文档
- 搜索相关技术论坛 