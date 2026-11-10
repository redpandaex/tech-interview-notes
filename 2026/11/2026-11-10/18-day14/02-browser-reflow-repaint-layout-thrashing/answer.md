# 第 14 天 · 第 2 题：原始回答与追问记录

**最终评分：87/100**

## 主问题：重排、重绘、强制同步布局与批量 DOM 优化

### 用户原始回答（逐字保留）

> Reflow是重新计算布局,repaint是重新绘制画面
> 浏览器对进行dom计算时会合并一些操作,但是在读取offsetWidth中会导致浏览器要停止更新然后立即返回值,会打算浏览器的优化
> 采用读写分离的方式避免打断浏览器的优化,最好还采用动态渲染的办法

### 反馈

- Reflow/Repaint 定义正确。
- 识别到浏览器会合并布局更新，读取 offsetWidth 可能打断延迟布局；补充：仅当布局失效且需要最新尺寸时，才可能强制同步布局。
- 读写分离正确；动态渲染可进一步具体化为虚拟列表、按需渲染、减少 DOM 数量。

## 第一次追问：Layout Thrashing 与 transform

### 问题

```js
const elements = document.querySelectorAll(".item");
elements.forEach((el) => {
  el.style.width = `${container.offsetWidth}px`;
});
```

1. 性能问题？
2. 为什么提前读取 container.offsetWidth 更好？
3. transform: translateX 为什么通常优于 left？

### 用户原始回答（逐字保留）

> 1. 读写未分离,可能会导致布局抖动
> 2. 读写分离了,浏览器可以自定义优化计算
> 3. transform通常不会触发reflow和repaint,

### 反馈

- Layout Thrashing 判断正确，但不一定每轮都发生；取决于子元素修改是否影响容器布局。
- 提前读取一次、之后统一写入可以避免重复读取和读写交错。
- transform 通常不触发布局；在符合合成条件时可跳过绘制直接合成，但并非绝对不触发重绘。

## 第二次追问：侧边栏动画与 will-change

### 问题

```css
/* A */
.sidebar { position: absolute; left: -300px; transition: left 300ms; }
.sidebar.open { left: 0; }

/* B */
.sidebar { transform: translateX(-100%); transition: transform 300ms; }
.sidebar.open { transform: translateX(0); }
```

1. 为什么推荐 B？
2. 1000 个元素都设置 will-change: transform 是否一定更快？

### 用户原始回答（逐字保留）

> 首先是方案B更加的优雅,且性能更好,减少了重排和重绘
>
> 1. 不一定,这个属性是告诉浏览器这个属性要进行transform了,让浏览器准备好优化,但是浏览器会根据实际情况去做优化的

### 反馈

- B 通常更适合滑动动画，因为 transform 通常不触发布局，满足条件时可直接合成。
- “更优雅”不是技术上的决定性理由；left 固定偏移与 translateX 百分比偏移的语义也不同。
- will-change 是优化提示，不保证浏览器一定创建合成层或获得收益。
- 关键缺漏：大量合成层可能增加显存、内存与合成管理成本，性能反而下降。

## 最终评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 28/30 |
| 解决方案 | 35/40 |
| 原理理解 | 17/20 |
| 边界意识 | 7/10 |
| **总分** | **87/100** |
