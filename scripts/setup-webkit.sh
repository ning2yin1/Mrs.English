#!/usr/bin/env bash
# Rootless WebKit prerequisites for the Debian 13 cloud image.
# APT verifies signed repository metadata and package hashes; nothing is installed system-wide.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(. /etc/os-release; printf '%s' "$ID:$VERSION_ID")" != 'debian:13' ]]; then
  echo 'This helper supports Debian 13 only. Use the official Playwright dependency installer for other hosts.' >&2
  exit 1
fi
webkit_root=/workspace/.mrs-system
mkdir -p "$webkit_root/apt/lists/partial" "$webkit_root/apt/cache/archives/partial" "$webkit_root/apt/log" "$webkit_root/root"
cat > "$webkit_root/apt/sources.list" <<'SOURCES'
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian trixie main
SOURCES
apt_options=(
  -o Debug::NoLocking=true
  -o "Dir::State::lists=$webkit_root/apt/lists"
  -o "Dir::Cache=$webkit_root/apt/cache"
  -o "Dir::Log=$webkit_root/apt/log"
  -o "Dir::Etc::sourcelist=$webkit_root/apt/sources.list"
  -o Dir::Etc::sourceparts=-
  -o "APT::Sandbox::User=$(id -un)"
)
/usr/bin/apt-get "${apt_options[@]}" update
/usr/bin/apt-get "${apt_options[@]}" --download-only --no-install-recommends -y install \
  libgtk-4-1 libgraphene-1.0-0 libharfbuzz-icu0 libmanette-0.2-0 libhyphen0 libgles2
for package in "$webkit_root"/apt/cache/archives/*.deb; do
  dpkg-deb -x "$package" "$webkit_root/root"
done
PLAYWRIGHT_BROWSERS_PATH=/workspace/.mrs-browsers npx playwright install webkit
webkit_revision=$(node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync('node_modules/playwright-core/browsers.json','utf8')).browsers.find(b=>b.name==='webkit').revision)")
# The official MiniBrowser wrapper uses its own search directories. Add only
# missing, APT-verified dependencies; never replace a bundled library or executable.
for engine in minibrowser-wpe minibrowser-gtk; do
  bundle_libs="/workspace/.mrs-browsers/webkit-$webkit_revision/$engine/sys/lib"
  for library in "$webkit_root"/root/usr/lib/x86_64-linux-gnu/*.so*; do
    target="$bundle_libs/$(basename "$library")"
    if [[ ! -e "$target" && ! -L "$target" ]]; then ln -s "$library" "$target"; fi
  done
done
printf '%s\n' 'WebKit prepared. Run npm run test:webkit.'
