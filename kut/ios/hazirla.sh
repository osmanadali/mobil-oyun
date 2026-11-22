#!/bin/bash
# 'npx cap add ios' ile üretilen Kut Arena projesini hazırlar (Codemagic, macOS). ios/ depoda yok, her derlemede yeniden üretilir.
# Kut Arena yalnız iPad ve yalnız yatay oynanır.
set -euo pipefail
cd "$(dirname "$0")"
P=ios/App/App/Info.plist PB=/usr/libexec/PlistBuddy
pb() { "$PB" -c "$1" "$P"; }
put() { pb "Delete :$1" 2>/dev/null || true; pb "Add :$1 $2${3:+ \"$3\"}"; }
pb "Set :CFBundleDisplayName Kut Arena"
# yalnız yatay (iPhone anahtarı da yatay; cihaz ailesi derlemede TARGETED_DEVICE_FAMILY=2)
for k in UISupportedInterfaceOrientations "UISupportedInterfaceOrientations~ipad"; do
  put "$k" array
  pb "Add :$k:0 string UIInterfaceOrientationLandscapeLeft"
  pb "Add :$k:1 string UIInterfaceOrientationLandscapeRight"
done
put UIRequiresFullScreen bool true          # iPad'de bölünmüş ekran yok: tam ekran oyun
put UIStatusBarHidden bool true
put UIViewControllerBasedStatusBarAppearance bool false
put ITSAppUsesNonExemptEncryption bool false  # şifreleme beyanı sorusu çıkmasın (yalnız standart HTTPS)
plutil -lint "$P"
# Ses: varsayılan ses oturumu (soloAmbient) iPad'in sessiz anahtarında Web Audio'yu susturur ve ilk çalmada
# oturumu bazen etkinleştirmez. .playback + mixWithOthers: sessiz anahtar açıkken de oyun sesi/müziği duyulur.
AD=ios/App/App/AppDelegate.swift
if ! grep -q 'AVAudioSession' "$AD"; then
  grep -q 'didFinishLaunchingWithOptions.*-> Bool {' "$AD" || { echo "HATA: AppDelegate.swift şablonu beklenmedik (didFinishLaunching bulunamadı)"; exit 1; }
  perl -0pi -e 's/^import UIKit\n/import UIKit\nimport AVFoundation\n/m' "$AD"
  perl -0pi -e 's/(func application\(_ application: UIApplication, didFinishLaunchingWithOptions[^\n]*-> Bool \{\n)/$1        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])\n        try? AVAudioSession.sharedInstance().setActive(true)\n/' "$AD"
fi
grep -q 'import AVFoundation' "$AD" && grep -q 'setCategory(.playback' "$AD" || { echo "HATA: AppDelegate.swift ses oturumu yaması uygulanamadı"; exit 1; }
echo "Kut Arena Info.plist ve AppDelegate (ses oturumu) hazır"
