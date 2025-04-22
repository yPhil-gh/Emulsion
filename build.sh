#!/usr/bin/env bash

# See .gitlab-ci.yml for build system dependancies

# mkdir -pv dist

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


# Store original directory
original_dir=$(pwd)

# Create or empty build directory
if [ ! -d "build" ]; then
    mkdir -v build
else
    echo "Emptying build directory..."
    rm -rfv build/* 2>/dev/null  # Silence errors if already empty
fi

# Run build process
npm run build || {
    echo "Build failed!"
    exit 1
}

# Rename files and return to original dir
(
    cd build || exit 1
    for item in Emultion*; do
        [ -e "$item" ] || continue
        mv -v "$item" "emultion${item#Emultion}"
    done
)

echo "Operation complete. Back in: $(pwd)"

# Create build & rebuild dirs and files (see README.md "sandbox" why)
mkdir -pv repack out DEBIAN

generateDesktopFile
generateDebControlFile

doDeb() {
    local pkg="dist/$PACKAGE_NAME.deb"
    if [ ! -f "$pkg" ]; then
        echo "Error: $pkg not found"
        return 1
    fi

    echo "Processing .deb package..."

    # Clean slate
    rm -rf repack out
    mkdir -p repack out

    # Step 1: Copy original and extract control+data
    cp -v "$pkg" repack/
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
    dpkg-deb -b "repack/$PACKAGE_NAME" "out/$PACKAGE_NAME.deb"

    echo "Rebuilt .deb:"
    du -h "out/$PACKAGE_NAME.deb"

    # (Optionally) replace the original
    cp -v "out/$PACKAGE_NAME.deb" "dist/$PACKAGE_NAME.deb"
    echo "Replaced dist/$PACKAGE_NAME.deb with rebuilt package."
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
    echo "PWD: $(pwd) name: $PACKAGE_NAME"
    if [ -f "dist/$PACKAGE_NAME.AppImage" ]; then
        echo "Processing .AppImage package..."
        cd ./dist/
        ./"$PACKAGE_NAME.AppImage" --appimage-extract
        # cp -v ../AppRun ./squashfs-root/AppRun
        modify_atexit "./squashfs-root/AppRun"
        rm -rfv ./squashfs-root/locales/*
        # ../appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
        echo "PWD: $(pwd) name: $PACKAGE_NAME"
        if command -v ../bin/appimagetool-x86_64.AppImage &> /dev/null; then
            echo "Using appimagetool from PATH"
            ../bin/appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
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

rm -v ./emulsion.desktop
rm -rfv ./squashfs-root/
rm -rfv ./DEBIAN/
rm -rfv ./out/

echo "Post-build process for $PACKAGE_NAME complete."
