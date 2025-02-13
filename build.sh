#!/usr/bin/env bash

# See .gitlab-ci.yml for build system dependancies

packageName() {
    echo "$(jq -r '.name' package.json)-$(jq -r '.version' package.json)"
}

author() {
    echo "$(jq -r '.author.name' package.json) <$(jq -r '.author.email' package.json)>"
}

PACKAGE_NAME=$(packageName)

echo "Building $PACKAGE_NAME"

generateDebControlFile() {
    local name=$(jq -r '.name' package.json)
    local version=$(jq -r '.version' package.json)
    local description=$(jq -r '.description' package.json)
    local license=$(jq -r '.license' package.json)
    local author="$(jq -r '.author.name' package.json) <$(jq -r '.author.email' package.json)>"

    cat <<EOF > DEBIAN/control
Package: $name
Version: $version
Architecture: amd64
Maintainer: $author
Description: $description
EOF
}

generateDesktopFile() {
    local name=$(jq -r '.name' package.json)
    local description=$(jq -r '.description' package.json)

    cat <<EOF > emume.desktop
[Desktop Entry]
Name=$name
Exec=/opt/EmumE/emume --no-sandbox %U
Terminal=false
Type=Application
Icon=emume
StartupWMClass=Emume
Comment=$description
Categories=Utility;
EOF
}

# Build ; This cleans, too, see package.json
npm run build

# Create build & rebuild dirs and files (see README.md "sandbox" why)
mkdir -pv repack out DEBIAN

generateDesktopFile
generateDebControlFile

doDeb() {
    if [ -f "dist/$PACKAGE_NAME.deb" ]; then
        echo "Processing .deb package..."

        # Prepare the repack directories
        mkdir -p ./repack
        mkdir -p ./out

        # Copy and extract the .deb package
        cp -v "dist/$PACKAGE_NAME.deb" ./repack/
        dpkg-deb -x -v "./repack/$PACKAGE_NAME.deb" ./repack/

        # Copy the custom files to the appropriate locations
        cp -v ./emume.desktop ./repack/usr/share/applications/

        # Copy ./DEBIAN/control file
        cp -Rv ./DEBIAN ./repack/

        # Remove the (50Mb+) locales, not sure if that really works
        rm -rf "./repack/opt/Emume/locales"

        # Rebuild the .deb package into the 'out' directory
        dpkg-deb --build ./repack "./out/$PACKAGE_NAME.deb"
        # dpkg-deb -v -Zxz -z9 -Sextreme -b ./repack "./out/$PACKAGE_NAME.deb"

        # Done
        echo "Size before move: $(du -h "./dist/$PACKAGE_NAME.deb")"
        cp -v "./out/$PACKAGE_NAME.deb" "./dist/$PACKAGE_NAME.deb"
        echo "Size after move: $(du -h "./dist/$PACKAGE_NAME.deb")"
        echo ".deb package rebuilt and saved to ./dist/$PACKAGE_NAME.deb"
    fi
}

modify_atexit() {
  local file="$1"
  sed -i '39,48c\
atexit()\
{\
  if [ $isEulaAccepted == 1 ] ; then\
    if [ $NUMBER_OF_ARGS -eq 0 ] ; then\
      exec "$BIN" "--no-sandbox"\
    else\
      exec "$BIN" "${args[@]}" "--no-sandbox"\
    fi\
  fi\
}' "$file"
}

doAppImage() {
    if [ -f "dist/$PACKAGE_NAME.AppImage" ]; then
        echo "Processing .AppImage package..."
        cd ./dist/
        ./"$PACKAGE_NAME.AppImage" --appimage-extract
        # cp -v ../AppRun ./squashfs-root/AppRun
        modify_atexit "./squashfs-root/AppRun"
        rm -rfv ./squashfs-root/locales/*
        # ../appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
        if command -v appimagetool-x86_64.AppImage &> /dev/null; then
            echo "Using appimagetool from PATH"
            appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
        else
            # We are in GitLab CI/CD
            echo "Using local ../appimagetool-x86_64.AppImage"
            ../appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
        fi
    fi
}

# Yeah :|

doDeb
doAppImage

cd ..

echo "In dist: $(ls -la ./dist/)"

rm -v ./emume.desktop
rm -rfv ./squashfs-root/
rm -rfv ./DEBIAN/
rm -rfv ./out/

echo "Post-build process for $PACKAGE_NAME complete."
