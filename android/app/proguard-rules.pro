# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# Expo
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# Hermes
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# Keep React Native bridges
-keepclassmembers class * {
  @com.facebook.react.bridge.ReactMethod *;
}
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }

# Keep TurboModule
-keep class com.facebook.react.turbomodule.** { *; }

# General
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes InnerClasses
-keepattributes EnclosingMethod
