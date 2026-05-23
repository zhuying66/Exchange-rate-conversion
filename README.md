# 实时汇率转换 (Currency Converter)

基于 React Native (Expo SDK 52) 的 Android 实时汇率转换应用。数据来源为[欧洲央行 (ECB)](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml) 每日汇率，无需注册 API Key。

## 功能

- 18 种常用货币实时汇率转换
- 30 秒自动刷新汇率
- 下拉手动刷新
- 支持断网离线汇率
- 白色简洁 UI 界面
- 仅 Android (arm64-v8a)

## 技术栈

- React Native 0.76.6 (Expo Bare Workflow)
- Hermes JS 引擎
- New Architecture (Fabric/Bridgeless)
- 欧洲央行 XML 汇率数据 (免费、无需注册)

## 构建

```bash
npm install
cd android
./gradlew assembleRelease
```

APK 输出路径: `android/app/build/outputs/apk/release/app-release.apk`

## 项目结构

```
├── App.js              # 入口文件
├── src/
│   ├── screens/
│   │   └── ConverterScreen.js   # 主界面
│   ├── components/
│   │   └── CurrencyPicker.js    # 货币选择器
│   └── services/
│       └── api.js               # 汇率数据服务
├── android/            # Android 原生工程
└── app.json            # Expo 配置
```

## 许可证

MIT License
