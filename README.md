# Currency Converter

A real-time currency conversion Android app built with React Native (Expo SDK 52). Exchange rate data from the [Frankfurter API](https://api.frankfurter.app) (ECB-sourced) — free, no API key required.

## Features

- Real-time conversion across 18 currencies
- Auto-refresh every 30 seconds
- Pull-to-refresh for manual updates
- Offline fallback rates when network is unavailable
- In-app language toggle (English / Chinese)
- Clean light-themed UI with currency flags
- Android only (arm64-v8a)

## Tech Stack

- React Native 0.76.6 (Expo Bare Workflow)
- Hermes JS Engine
- New Architecture (Fabric / Bridgeless)
- Frankfurter API for exchange rates (free, no registration)

## Build

```bash
npm install
cd android
./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
├── App.js              # Entry point
├── src/
│   ├── screens/
│   │   └── ConverterScreen.js   # Main screen
│   ├── components/
│   │   └── CurrencyPicker.js    # Currency picker modal
│   ├── i18n/
│   │   ├── translations.js      # English / Chinese strings
│   │   └── LanguageContext.js    # Language state provider
│   └── services/
│       └── api.js               # Frankfurter API + offline fallback
├── android/            # Android native project
└── app.json            # Expo configuration
```

## License

MIT License
