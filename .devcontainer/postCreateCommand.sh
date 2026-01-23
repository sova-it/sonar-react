#!/bin/bash
set -e


mkdir -p "$HOME/.config/fish"
cp .devcontainer/.config/starship.toml ~/.config/starship.toml

echo 'starship init fish | source' >> "$HOME/.config/fish/config.fish"

# --- Install Node requirements ---
if command -v npm >/dev/null 2>&1; then
    echo "Installing Node requirements via npm..."
    npm install
else
    echo "npm not found; skipping installation."
fi
