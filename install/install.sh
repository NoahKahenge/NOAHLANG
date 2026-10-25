#!/usr/bin/env bash
# install/install.sh — NoahLang installer for macOS and Linux
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/NoahKahenge/noahlang-debugger/main/install/install.sh | bash

set -e

VERSION="2.0.2"
$Repo = "NoahKahenge/NOAHLANG"

echo ""
echo "  NoahLang installer"
echo "  ──────────────────"
echo ""

# ------------------------------------------------------------------
# 1. Check for Node.js
# ------------------------------------------------------------------
NODE_OK=false
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version 2>/dev/null | sed 's/^v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 16 ] 2>/dev/null; then
        echo "  ✓ Node.js v$NODE_VERSION found"
        NODE_OK=true
    else
        echo "  ⚠ Node.js v$NODE_VERSION is too old (need 16+)"
    fi
else
    echo "  ⚠ Node.js not found"
fi

# ------------------------------------------------------------------
# 2. Install Node.js if needed
# ------------------------------------------------------------------
if [ "$NODE_OK" != "true" ]; then
    echo ""
    echo "  Installing Node.js..."
    echo ""

    OS="$(uname -s)"
    ARCH="$(uname -m)"

    if [ "$OS" = "Darwin" ]; then
        # macOS
        if command -v brew >/dev/null 2>&1; then
            echo "  Using Homebrew..."
            brew install node
        else
            echo "  Homebrew not found. Installing Node.js from nodejs.org..."
            NODE_VERSION="20.11.0"
            if [ "$ARCH" = "arm64" ]; then
                NODE_ARCH="arm64"
            else
                NODE_ARCH="x64"
            fi
            NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
            TMP_DIR=$(mktemp -d)
            curl -fsSL "$NODE_URL" -o "$TMP_DIR/node.tar.gz"
            tar -xzf "$TMP_DIR/node.tar.gz" -C "$TMP_DIR"
            sudo cp -R "$TMP_DIR"/node-v${NODE_VERSION}-darwin-${NODE_ARCH}/bin/* /usr/local/bin/
            sudo cp -R "$TMP_DIR"/node-v${NODE_VERSION}-darwin-${NODE_ARCH}/lib/node_modules /usr/local/lib/
            rm -rf "$TMP_DIR"
        fi
    elif [ "$OS" = "Linux" ]; then
        # Linux
        if command -v apt-get >/dev/null 2>&1; then
            echo "  Using apt..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v dnf >/dev/null 2>&1; then
            echo "  Using dnf..."
            sudo dnf install -y nodejs
        elif command -v yum >/dev/null 2>&1; then
            echo "  Using yum..."
            sudo yum install -y nodejs
        elif command -v pacman >/dev/null 2>&1; then
            echo "  Using pacman..."
            sudo pacman -S --noconfirm nodejs npm
        elif command -v apk >/dev/null 2>&1; then
            echo "  Using apk..."
            sudo apk add nodejs npm
        else
            echo ""
            echo "  ❌ Could not find a package manager."
            echo "     Please install Node.js 16+ from https://nodejs.org/"
            exit 1
        fi
    else
        echo ""
        echo "  ❌ Unsupported operating system: $OS"
        echo "     Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi

    # Verify Node was installed
    if ! command -v node >/dev/null 2>&1; then
        echo ""
        echo "  ❌ Node.js installation failed."
        exit 1
    fi
    echo "  ✓ Node.js $(node --version) installed"
fi

# ------------------------------------------------------------------
# 3. Install noahlang
# ------------------------------------------------------------------
echo ""
echo "  Installing NoahLang..."
echo ""

if ! command -v npm >/dev/null 2>&1; then
    echo "  ❌ npm not found. Something went wrong with the Node.js install."
    exit 1
fi

npm install -g noahlang

# ------------------------------------------------------------------
# 4. Verify
# ------------------------------------------------------------------
echo ""

if command -v noah >/dev/null 2>&1; then
    NOAH_VERSION=$(noah --version 2>/dev/null || echo "unknown")
    echo "  ✓ NoahLang installed"
    echo "    $NOAH_VERSION"
else
    echo "  ❌ Installation failed. Could not find 'noah' command."
    echo "     Try running 'npm install -g noahlang' manually."
    exit 1
fi

# ------------------------------------------------------------------
# 5. Done
# ------------------------------------------------------------------
echo ""
echo "  ────────────────────────────────────────────"
echo ""
echo "  Try it:"
echo ""
echo '    echo '"'"'write "Hello, world!"'"'"' > hello.noah'
echo "    noah hello.noah"
echo ""
echo "  For web pages:"
echo ""
echo '    echo '"'"'pull "Forge.noah"'"'"' > site.noah'
echo '    echo '"'"'page("My Site")'"'"' >> site.noah'
echo '    echo '"'"'head1("Welcome")'"'"' >> site.noah'
echo '    echo '"'"'done()'"'"' >> site.noah'
echo '    echo '"'"'serve(3000)'"'"' >> site.noah'
echo "    noah --watch site.noah"
echo ""
echo "  Documentation: https://github.com/$REPO"
echo ""
