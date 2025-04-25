#!/usr/bin/env bash

# See .gitlab-ci.yml for build system dependancies

# mkdir -pv dist

packageName() {
    echo "$(jq -r '.name' package.json)"
}

author() {
    echo "$(jq -r '.author.name' package.json) <$(jq -r '.author.email' package.json)>"
}

PACKAGE_NAME=$(packageName)
PACKAGE_VERSION=$(jq -r '.version' package.json)

echo "Building $PACKAGE_NAME v$PACKAGE_VERSION"

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

    cat <<EOF > emulsion.desktop
[Desktop Entry]
Name=Emulsion
Exec=/opt/emulsion/emulsion --no-sandbox %U
Terminal=false
Type=Application
Icon=emulsion
StartupWMClass=Emulsion
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
    local pkg="dist/${PACKAGE_NAME}_amd64.deb"
    if [ ! -f "$pkg" ]; then
        echo "Error: $pkg not found"
        return 1
    fi

    echo "Processing Debian package..."

    # Clean slate
    rm -rf repack out
    mkdir -p repack out

    # Step 1: Copy original and extract control+data
    cp -v "$pkg" "repack/$PACKAGE_NAME.deb"
    dpkg-deb -R "repack/$PACKAGE_NAME.deb" "repack/$PACKAGE_NAME"

    # Now you have:
    #   repack/$PACKAGE_NAME/DEBIAN/    <- control files
    #   repack/$PACKAGE_NAME/usr/...    <- data

    # Step 2: Inject the .desktop
    install -Dm644 \
            emulsion.desktop \
            "repack/$PACKAGE_NAME/usr/share/applications/emulsion.desktop"

    # Step 3: Remove huge locales directory
    rm -rf "repack/$PACKAGE_NAME/opt/emulsion/locales"

    # Step 4: Rebuild the .deb
    dpkg-deb -b "repack/$PACKAGE_NAME" "$pkg"

    echo "PWD doDeb: $(pwd)"
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
    local pkg="${PACKAGE_NAME}_x86_64.AppImage"
    echo "Processing $pkg..."
    if [ -f "dist/$pkg" ]; then
        cd ./dist/
        ./"$pkg" --appimage-extract
        # cp -v ../AppRun ./squashfs-root/AppRun
        modify_atexit "./squashfs-root/AppRun"
        rm -rfv ./squashfs-root/locales/*
        # ../appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
        echo "PWD: $(pwd) name: $pkg"
        if command -v ../bin/appimagetool-x86_64.AppImage &> /dev/null; then
            echo "Using appimagetool from PATH"
            ../bin/appimagetool-x86_64.AppImage squashfs-root "$pkg"
        else
            # We are in GitLab CI/CD
            echo "Using local ../appimagetool-x86_64.AppImage"
            ../appimagetool-x86_64.AppImage squashfs-root "$pkg"
        fi
        cd ..
    fi
}

# Yeah :|

doDeb
doAppImage

# cd ..

echo "In dist: $(ls -la ./dist/)"

# rm -v ./emulsion.desktop
# rm -rfv ./DEBIAN/
# rm -rfv ./out/

# rm -rfv ./squashfs-root/

echo "Post-build process for $PACKAGE_NAME v$PACKAGE_VERSION complete."
