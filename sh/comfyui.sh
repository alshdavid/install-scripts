#!/usr/bin/sh

set -e

while [ $# -gt 0 ]; do
  case "$1" in
    --civit*|-c*)
      if [[ "$1" != *=* ]]; then shift; fi # Value is next arg if no `=`
      CIVIT="${1#*=}"
      ;;
    --gpu*|-g*)
      if [[ "$1" != *=* ]]; then shift; fi # Value is next arg if no `=`
      GPU="${1#*=}"
      ;;
    *)
      >&2 printf "Error: Invalid argument\n"
      exit 1
      ;;
  esac
  shift
done

if [ "$GPU" = "" ]; then
    GPU="nvidia"
fi

echo ""
echo "*** USING GPU: $GPU ***"
if ! [ "$CIVIT" = "" ]; then 
  echo "*** USING CIVIT AI TOKEN ***"
else
  echo "*** NO CIVIT AI TOKEN ***"
fi
echo ""

# System
echo "*** Updating System Dependencies ***"
echo ""

SUDO="sudo"
if [ "$(whoami)" = "root" ]; then
  SUDO=""
fi

if [ -x "$(command -v apt)" ]; then
  env DEBIAN_FRONTEND=noninteractive $SUDO apt update -y
  env DEBIAN_FRONTEND=noninteractive $SUDO apt upgrade -y
  env DEBIAN_FRONTEND=noninteractive $SUDO apt install -y curl git
elif [ -x "$(command -v dnf)" ]; then 
  $SUDO dnf update -y
  $SUDO dnf upgrade -y
  $SUDO dnf install -y curl git
else
  echo 'Unknown package manager'
fi

# Creating ComfyUI Folder
echo "*** Creating ComfyUI Folder ***"
echo ""

mkdir $PWD/ComfyUI
mkdir $PWD/share
mkdir $PWD/bin

# Python
echo "*** Installing Python ***"
echo ""

eval $(curl -sSf "sh.davidalsh.com/python.sh" | sh -s -- --version=3.12 --out-dir="$PWD/share/python")

"$PWD/share/python/bin/python" -m pip install --upgrade pip
"$PWD/share/python/bin/python" -m pip install --upgrade wheel

#     echo "export PATH=\"\$HOME/.local/python/${PYTHON_VERSION}:\$PATH\"" >> $HOME/.zshrc
#     echo "export PATH=\"\$HOME/.local/python/${PYTHON_VERSION}:\$PATH\"" >> $HOME/.bashrc

# # PyTorch
# echo Installing Pytorch
# if [ "$GPU" = "nvidia" ]; then
#     python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
#     #python -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu118
# fi
# if [ "$GPU" = "amd" ]; then
#     python -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/rocm6.3
# fi
# if [ "$GPU" = "cpu" ]; then
#     python -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cpu
# fi

# # ComfyUI
# if ! [ -d "ComfyUI" ]; then
#     git clone "https://github.com/comfyanonymous/ComfyUI.git"
# fi

# cd ComfyUI
#     python -m pip install -r "./requirements.txt"

#     # ComfyUI Custom Nodes
#     cd custom_nodes
#         if ! [ -d "ComfyUI-Manager" ]; then
#             git clone "https://github.com/ltdrdata/ComfyUI-Manager.git"
#         fi
#         cd ComfyUI-Manager
#             python -m pip install -r "./requirements.txt"
#             cd ..

#         if ! [ -d "was-node-suite-comfyui" ]; then
#             git clone "https://github.com/WASasquatch/was-node-suite-comfyui.git"
#         fi
#         cd was-node-suite-comfyui
#             python -m pip install -r "./requirements.txt"
#             cd ..

#         if ! [ -d "rgthree-comfy" ]; then
#             git clone https://github.com/rgthree/rgthree-comfy
#         fi
#         cd rgthree-comfy
#             python -m pip install -r "./requirements.txt"
#             cd ..

#         if ! [ -d "ComfyUI-Impact-Pack" ]; then
#             git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack.git
#         fi
#         cd ComfyUI-Impact-Pack
#             python -m pip install -r "./requirements.txt"
#             cd ..

#         if ! [ -d "ComfyUI-Impact-Subpack" ]; then
#             git clone https://github.com/ltdrdata/ComfyUI-Impact-Subpack.git
#         fi
#         cd ComfyUI-Impact-Subpack
#             python -m pip install -r "./requirements.txt"
#             cd ..
        
#         cd ..

#     mv models ../models
#     mv output ../output
#     cd ..

# ln -sr ./models ./ComfyUI/models
# ln -sr ./output ./ComfyUI/output

# if [ -f "/etc/systemd/system/comfyui.service" ]; then
#     systemctl stop comfyui  || true
#     rm -rf /etc/systemd/system/comfyui.service
#     systemctl daemon-reload  || true
# fi

# # SystemD
# echo "[Unit]"                                                                           >> /etc/systemd/system/comfyui.service
# echo "Description=ComfyUI Service"                                                      >> /etc/systemd/system/comfyui.service
# echo "After=network.target"                                                             >> /etc/systemd/system/comfyui.service
# echo ""                                                                                 >> /etc/systemd/system/comfyui.service
# echo "[Service]"                                                                        >> /etc/systemd/system/comfyui.service
# echo "Type=simple"                                                                      >> /etc/systemd/system/comfyui.service
# echo "User=root"                                                                        >> /etc/systemd/system/comfyui.service

# if [ "$GPU" = "nvidia" ]; then
#     echo "ExecStart=$(which python) /root/ComfyUI/main.py --disable-cuda-malloc"    >> /etc/systemd/system/comfyui.service
# fi
# if [ "$GPU" = "amd" ]; then
#     echo "ExecStart=$(which python) /root/ComfyUI/main.py"                          >> /etc/systemd/system/comfyui.service
# fi
# if [ "$GPU" = "cpu" ]; then
#     echo "ExecStart=$(which python) /root/ComfyUI/main.py --cpu"                    >> /etc/systemd/system/comfyui.service
# fi

# echo "Restart=on-failure"                                                               >> /etc/systemd/system/comfyui.service
# echo ""                                                                                 >> /etc/systemd/system/comfyui.service
# echo "[Install]"                                                                        >> /etc/systemd/system/comfyui.service
# echo "WantedBy=multi-user.target"                                                       >> /etc/systemd/system/comfyui.service

# sudo systemctl daemon-reload
# sudo systemctl status comfyui || true
# sudo systemctl enable comfyui
# sudo systemctl start comfyui

# # Health Check
# while ! curl -s --fail "http://localhost:8188" > /dev/null; do
#     echo >&2 'ComfyUI down, trying again in 1s...'
#     sleep 1
# done
# echo >&2 'ComfyUI up'

# # Bins
# mkdir -p $HOME/.local/bin
# export PATH="$HOME/.local/bin:$PATH"

# curl --output $HOME/.local/bin/civit https://cdn.davidalsh.com/scripts/vultr-civit.bash
# chmod +x $HOME/.local/bin/civit

# echo "" >> $HOME/.zshrc
# echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> $HOME/.zshrc
# echo "" >> $HOME/.zshrc

# echo "" >> $HOME/.bashrc
# echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> $HOME/.bashrc
# echo "" >> $HOME/.bashrc

# if [ "$CIVIT" = "" ]; then
#     exec zsh
#     exit 0
# fi

# echo "" >> $HOME/.zshrc
# echo "export CTV=\"$CIVIT\"" >> $HOME/.zshrc
# echo "" >> $HOME/.zshrc

# echo "" >> $HOME/.bashrc
# echo "export CTV=\"$CIVIT\"" >> $HOME/.bashrc
# echo "" >> $HOME/.bashrc

# exec zsh
