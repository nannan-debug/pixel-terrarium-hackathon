# 像素生态箱 Pixel Terrarium

24 小时黑客松风格的 React/Vite 网页游戏 Demo。玩家初始化横版像素生态箱，投放生命、资源或照片生成的像素物件，然后加速观察 10 年、50 年、100 年后的生态演化。

## Features

- 横版像素生态箱 Canvas
- 小岛、海洋、陆地、群山地形模板
- 规则驱动的移动、进食、繁殖、死亡、天气事件
- 属性突变、新物种、灭绝记录
- 10/50/100 年生态报告与成就
- 个体生命传记
- 图片上传投放：可接 AI 像素重绘接口，默认本地像素化，失败时预置样例兜底

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Build

```bash
npm run build
```

## Optional AI Pixel Endpoint

Set `VITE_PIXEL_AI_ENDPOINT` to a POST endpoint that accepts multipart form data field `image` and returns:

```json
{
  "label": "optional label",
  "dataUrl": "data:image/png;base64,..."
}
```
