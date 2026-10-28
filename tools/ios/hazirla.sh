#!/bin/bash
# 'npx cap add ios' ile üretilen projeyi Ray için hazırlar (CI: ios.yml; macOS). ios/ depoda yok, her derlemede yeniden üretilir.
# Ortam: ADMOB_APP_ID_IOS (yoksa Google test App ID), ADMOB_INTERSTITIAL_IOS + ADMOB_REWARDED_IOS (varsa index.html'e window.RAY_ADS),
#        VERSION_CODE (yapı numarası, yoksa 1), VERSION_NAME (yoksa package.json)
set -euo pipefail
cd "$(dirname "$0")/../.."
P=ios/App/App/Info.plist PBX=ios/App/App.xcodeproj/project.pbxproj PB=/usr/libexec/PlistBuddy
APP_ID=${ADMOB_APP_ID_IOS:-ca-app-pub-3940256099942544~1458002511}
VN=${VERSION_NAME:-$(node -p "require('./package.json').version")} VC=${VERSION_CODE:-1}
pb() { "$PB" -c "$1" "$P"; }
put() { pb "Delete :$1" 2>/dev/null || true; pb "Add :$1 $2${3:+ \"$3\"}"; }   # anahtar varsa yenisiyle değiştir

# 1) Info.plist
pb "Set :CFBundleDisplayName Ray"
pb "Set :CFBundleDevelopmentRegion tr"
put GADApplicationIdentifier string "$APP_ID"
put NSUserTrackingUsageDescription string "İzin verirsen reklamlar ilgi alanlarına göre seçilebilir. Vermesen de oyun aynen çalışır; reklamlar yine görünür ama daha az kişisel olur."
put ITSAppUsesNonExemptEncryption bool false
put UIRequiresFullScreen bool true
for k in UISupportedInterfaceOrientations "UISupportedInterfaceOrientations~ipad"; do   # yalnız dikey
  put "$k" array; pb "Add :$k:0 string UIInterfaceOrientationPortrait"
done
put SKAdNetworkItems array; i=0
while read -r id; do
  case "$id" in ''|\#*) continue;; esac
  pb "Add :SKAdNetworkItems:$i dict"; pb "Add :SKAdNetworkItems:$i:SKAdNetworkIdentifier string $id"; i=$((i+1))
done < tools/ios/skadnetwork.txt
plutil -lint "$P"
echo "✓ Info.plist: AdMob $([ "$APP_ID" = "ca-app-pub-3940256099942544~1458002511" ] && echo '(Google test)' || echo '(gerçek)'), $i SKAdNetwork, yalnız dikey"

# 2) Xcode projesi: yalnız iPhone, sürüm
grep -q 'TARGETED_DEVICE_FAMILY' "$PBX" || { echo "TARGETED_DEVICE_FAMILY bulunamadı"; exit 1; }
sed -i '' -E "s/TARGETED_DEVICE_FAMILY = [^;]*;/TARGETED_DEVICE_FAMILY = 1;/g; s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = $VN;/g; s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = $VC;/g" "$PBX"
grep -E 'TARGETED_DEVICE_FAMILY|MARKETING_VERSION|CURRENT_PROJECT_VERSION|IPHONEOS_DEPLOYMENT_TARGET' "$PBX" | sort | uniq -c
echo "✓ Proje: yalnız iPhone, sürüm $VN ($VC)"

# 3) App Store simgesi saydamlık (alfa) içeremez → varsa düzleştir
for f in ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png; do
  if sips -g hasAlpha "$f" | grep -q 'hasAlpha: yes'; then
    sips -s format jpeg -s formatOptions best "$f" --out /tmp/ray-ikon.jpg >/dev/null && sips -s format png /tmp/ray-ikon.jpg --out "$f" >/dev/null; echo "  alfa kaldırıldı: $f"
  fi
done
echo "✓ Simge: $(sips -g pixelWidth -g hasAlpha ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png | grep -E 'pixelWidth|hasAlpha' | tr -s ' ' | paste -sd ' ' -)"

# 4) Gerçek reklam birimleri (ads.js'ten önce window.RAY_ADS). Yoksa ads.js Google test kimliklerini kullanır.
if [ -n "${ADMOB_INTERSTITIAL_IOS:-}" ] && [ -n "${ADMOB_REWARDED_IOS:-}" ]; then
  node -e "const f='www/index.html',fs=require('fs'),s=fs.readFileSync(f,'utf8'),t='<script src=\"ads.js\"></script>';if(!s.includes(t))throw Error('ads.js satırı yok');
    fs.writeFileSync(f,s.replace(t,'<script>window.RAY_ADS = '+JSON.stringify({ios:{interstitial:process.env.ADMOB_INTERSTITIAL_IOS,rewarded:process.env.ADMOB_REWARDED_IOS}})+'</script>'+t))"
  echo "✓ window.RAY_ADS (iOS)"
fi
