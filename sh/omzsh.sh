#!/usr/bin/sh
set -e

if [ -d "$HOME/.oh-my-zsh" ]; then
  echo OMZSH is already installed
  exit 0
fi


echo "*** Updating System Dependencies ***"
echo ""

SUDO="sudo"
if [ "$(whoami)" = "root" ]; then
  SUDO=""
fi

if [ -x "$(command -v apt)" ]; then
  env DEBIAN_FRONTEND=noninteractive $SUDO apt update -y
  env DEBIAN_FRONTEND=noninteractive $SUDO apt upgrade -y
  env DEBIAN_FRONTEND=noninteractive $SUDO apt install -y zsh curl git
elif [ -x "$(command -v dnf)" ]; then 
  $SUDO dnf update -y
  $SUDO dnf upgrade -y
  $SUDO dnf install -y zsh curl git
else
  echo 'Unknown package manager'
fi

echo "*** Clone Oh My Zsh ***"
echo ""
git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh

echo "*** Copy Config ***"
echo ""
grep -o '^[^#]*' $HOME/.oh-my-zsh/templates/zshrc.zsh-template > ~/.zshrc

# Allow pasting URLs without adding escape characters
echo "$(echo 'export DISABLE_MAGIC_FUNCTIONS=true' | cat - $HOME/.zshrc)" > $HOME/.zshrc

# Add $HOME/.local/bin to $PATH
echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> $HOME/.zshrc
mkdir -p $HOME/.local/bin

chsh -s $(which zsh)

echo "*** Done ***"
echo "*** Restart Terminal for changes to take effect ***"
