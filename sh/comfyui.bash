#!/usr/bin/env bash

PRE="false"
COMPUTE_PLATFORM=""
SYSTEMD="false"
MODIFY_PATH="false"
CADDY="false"

while [ $# -gt 0 ]; do
  case "$1" in
    --gpu*|-g*)
      if [[ "$1" != *=* ]]; then shift; fi # Value is next arg if no `=`
      GPU="${1#*=}"
      ;;
    --platform*|-p*)
      if [[ "$1" != *=* ]]; then shift; fi # Value is next arg if no `=`
      COMPUTE_PLATFORM="${1#*=}"
      ;;
    --out-dir*|-o*)
      if [[ "$1" != *=* ]]; then shift; fi # Value is next arg if no `=`
      OUT_DIR="${1#*=}"
      ;;
    --pre)
      PRE="true"
      ;;
    --modify-path)
      MODIFY_PATH="true"
      ;;
    --systemd)
      SYSTEMD="true"
      ;;
    --caddy)
      CADDY="true"
      ;;
    *)
      >&2 printf "Error: Invalid argument\n"
      exit 1
      ;;
  esac
  shift
done

if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$PWD/ComfyUI"
fi
if [ "$OUT_DIR" = "." ]; then
  OUT_DIR="$PWD"
fi
if [ "$OUT_DIR" = "~" ]; then
  OUT_DIR="$HOME"
fi
if [[ "$OUT_DIR" == ~* ]]; then
  OUT_DIR="$HOME${OUT_DIR#"~"}"
fi

SUDO="sudo"
if [ "$(whoami)" = "root" ]; then
  SUDO=""
fi

if [ "$GPU" = "" ]; then
    GPU="nvidia"
    COMPUTE_PLATFORM="cu118"
fi

if [ "$GPU" = "amd" ]; then
  if [ "$COMPUTE_PLATFORM" = "" ]; then
    COMPUTE_PLATFORM="gfx120X-all"
  fi
fi

SUDO="sudo"
if [ "$(whoami)" = "root" ]; then
  SUDO=""
fi

OS=""
case "$(uname -s)" in
  Darwin) OS="macos";;
  Linux) OS="linux";;
  MINGW64_NT* | Windows_NT | MSYS_NT*) OS="windows";;
  *) OS="";;
esac

>&2 echo "OUTPUT DIR:         $OUT_DIR"
>&2 echo "MODIFY_PATH:        $MODIFY_PATH"
>&2 echo "USING GPU:          $GPU"
>&2 echo "USING PLATFORM:     $COMPUTE_PLATFORM"
>&2 echo "USING PYTORCH PRE:  $PRE"
>&2 echo "ADD SERVICE:        $SYSTEMD"
>&2 echo "OS:                 $OS"

>&2 echo ""

# System
>&2 echo "*** Updating System Dependencies ***"

if [ -x "$(command -v apt)" ]; then
  env DEBIAN_FRONTEND=noninteractive $SUDO apt update -y 1>&2
  env DEBIAN_FRONTEND=noninteractive $SUDO apt upgrade -y 1>&2
  env DEBIAN_FRONTEND=noninteractive $SUDO apt install -y curl git 1>&2
elif [ -x "$(command -v dnf)" ]; then 
  $SUDO dnf update -y 1>&2
  $SUDO dnf upgrade -y 1>&2
  $SUDO dnf install -y curl git 1>&2
else
  >&2 echo 'Unknown package manager'
fi

# Creating ComfyUI Folder
>&2 echo "*** Creating ComfyUI Folder ***"

mkdir -p $OUT_DIR
mkdir -p $OUT_DIR/share
mkdir -p $OUT_DIR/bin

# Python
>&2 echo "*** Installing Python ***"

if [ "$OS" = "windows" ]; then
  export PATH="$OUT_DIR/share/python:$PATH"
  export PATH="$OUT_DIR/share/python/Scripts:$PATH"
else
  export PATH="$OUT_DIR/share/python/bin:$PATH"
fi

if ! [ -d "$OUT_DIR/share/python" ]; then
  eval $(curl -sSf "sh.davidalsh.com/python.sh" | sh -s -- --version=3.13 --out-dir="$OUT_DIR/share/python")

  python -m pip install --upgrade pip 1>&2
  python -m pip install --upgrade wheel 1>&2
fi

# ComfyUI
>&2 echo "*** Installing ComfyUI ***"
if ! [ -d "$OUT_DIR/share/comfyui" ]; then
  git clone "https://github.com/comfyanonymous/ComfyUI.git" "$OUT_DIR/share/comfyui" 1>&2
  cp -r $OUT_DIR/share/comfyui/models $OUT_DIR/models
  cp -r $OUT_DIR/share/comfyui/custom_nodes $OUT_DIR/custom_nodes
  cp -r $OUT_DIR/share/comfyui/input $OUT_DIR/input
  cp -r $OUT_DIR/share/comfyui/output $OUT_DIR/output
  # cp -r $OUT_DIR/share/comfyui/temp $OUT_DIR/temp
  # cp -r $OUT_DIR/share/comfyui/user $OUT_DIR/user
fi

# Custom Nodes
custom_nodes=(
  "https://github.com/ltdrdata/ComfyUI-Manager.git"
  "https://github.com/WASasquatch/was-node-suite-comfyui.git"
  "https://github.com/rgthree/rgthree-comfy.git"
  "https://github.com/ltdrdata/ComfyUI-Impact-Pack.git"
  "https://github.com/ltdrdata/ComfyUI-Impact-Subpack.git"
  "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git"
)

for element in "${custom_nodes[@]}"; do
  node_name=$(basename "${element%".git"}")
  node_path="$OUT_DIR/custom_nodes/$node_name"
  if ! [ -d "$node_path" ]; then
    git clone "$element" "$node_path" 1>&2
  fi
done

>&2 echo "*** Installing Python Dependencies ***"

>&2 echo Installing Pytorch
if [ "$GPU" = "nvidia" ]; then
  if [ "$PRE" = "true" ]; then
    python -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/$COMPUTE_PLATFORM 1>&2
  else
    python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/$COMPUTE_PLATFORM 1>&2
  fi
fi
if [ "$GPU" = "amd" ]; then
  if [ "$PRE" = "true" ]; then
    python -m pip install --pre torch torchvision torchaudio --index-url https://rocm.nightlies.amd.com/v2/$COMPUTE_PLATFORM/ 1>&2
  else
    python -m pip install torch torchvision torchaudio --index-url https://rocm.nightlies.amd.com/v2/$COMPUTE_PLATFORM/ 1>&2
  fi
fi
if [ "$GPU" = "cpu" ]; then
  if [ "$PRE" = "true" ]; then
    python -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cpu 1>&2
  else
    python -m pip install torch torchvision torchaudio 1>&2
  fi
fi

>&2 echo "*** Installing ComfyUI Dependencies ***"
python -m pip install -r "$OUT_DIR/share/comfyui/requirements.txt" 1>&2

>&2 echo "*** Installing ComfyUI Custom Node Dependencies ***"
for dir in $OUT_DIR/custom_nodes/*/; do
  if ! [ -f "$dir/requirements.txt" ]; then
    continue
  fi

  python -m pip install -r "$dir/requirements.txt" 1>&2
done

COMFYUI_BIN="$OUT_DIR/bin/comfyui"
ARGS=""
if [ "$GPU" = "nvidia" ]; then
  ARGS="--disable-cuda-malloc"
fi
if [ "$GPU" = "amd" ]; then
  ARGS="--disable-smart-memory"
fi
if [ "$GPU" = "cpu" ]; then
  ARGS="--cpu"
fi

rm -rf $COMFYUI_BIN

if [ "$OS" = "windows" ]; then
  # Create a PowerShell script for Windows
  COMFYUI_BIN_WIN="$OUT_DIR/bin/comfyui.ps1"
  COMFYUI_BIN_WIN_MKLN="$OUT_DIR/bin/comfyui-make-shortcut.ps1"

  rm -rf $COMFYUI_BIN_WIN
  rm -rf $COMFYUI_BIN_WIN_MKLN

  echo "#!/usr/bin/env powershell" >> $COMFYUI_BIN_WIN
  echo "\$ErrorActionPreference = \"Stop\"" >> $COMFYUI_BIN_WIN
  echo "\$ScriptPath = Split-Path -Parent -Path \$MyInvocation.MyCommand.Path" >> $COMFYUI_BIN_WIN
  echo "\$LocalPath  = Split-Path -Parent -Path \$ScriptPath" >> $COMFYUI_BIN_WIN
  echo "\$env:PATH = \"\$LocalPath\\share\\python;\$env:PATH\"" >> $COMFYUI_BIN_WIN
  echo "\$env:PATH = \"\$LocalPath\\share\\python\\Scripts;\$env:PATH\"" >> $COMFYUI_BIN_WIN
  echo "& \"\$LocalPath\\share\\python\\python.exe\" \"\$LocalPath\\share\\comfyui\\main.py\" --base-directory \"\$LocalPath\" ${ARGS}" >> $COMFYUI_BIN_WIN
  cp $COMFYUI_BIN_WIN $COMFYUI_BIN

  # Create a shortcut for Windows
  echo "\$powershell -File .\\bin\\comfyui.ps1" >> $OUT_DIR/ComfyUI.bat
  curl -o $OUT_DIR/share/icon.ico https://sh.davidalsh.com/assets/comfyui.ico
else
  # Create a shell script for unix
  rm -rf $COMFYUI_BIN

  echo "#!/usr/bin/sh" >> $COMFYUI_BIN
  echo "set -e" >> $COMFYUI_BIN
  echo "" >> $COMFYUI_BIN
  echo "SCRIPT_PATH=\`dirname \$0 | while read a; do cd \$a && pwd && break; done\`" >> $COMFYUI_BIN
  echo "LOCAL_PATH=\"\$(dirname \$SCRIPT_PATH)\"" >> $COMFYUI_BIN
  echo "export PATH=\"\$LOCAL_PATH/share/python/bin:\$PATH\"" >> $COMFYUI_BIN
  echo "exec \$LOCAL_PATH/share/python/bin/python \$LOCAL_PATH/share/comfyui/main.py --base-directory \$LOCAL_PATH ${ARGS}" >> $COMFYUI_BIN
fi

chmod +x $COMFYUI_BIN

echo "export PATH=\"${OUT_DIR}/bin:\$PATH\""

if [ "$MODIFY_PATH" = "true" ]; then
  if [ -f "$HOME/.zshrc" ]; then
    printf "\nexport PATH=\"${OUT_DIR}/bin:\$PATH\"\n" >> "$HOME/.zshrc"
  fi

  if [ -f "$HOME/.bashrc" ]; then
    echo "\nexport PATH=\"${OUT_DIR}/bin:\$PATH\"\n" >> "$HOME/.bashrc"
  fi

  # if ! [ "$SUDO" = "" ]; then
  #   $SUDO ln -s $COMFYUI_BIN /usr/local/bin/comfyui
  # fi
fi

if [ "$SYSTEMD" = "true" ]; then 
  if ! [ -x "$(command -v systemd)" ]; then
    >&2 echo "systemd not available"
    exit 1
  fi

  UNIT="$OUT_DIR/share/comfyui.service"
  UNIT_SYS="/etc/systemd/system/comfyui.service"

  if [ -f "$UNIT" ]; then
      rm -rf "$UNIT"
  fi

  if [ -f "$UNIT_SYS" ]; then
      $SUDO systemctl stop comfyui  || true
      $SUDO rm -rf "$UNIT_SYS"
      $SUDO systemctl daemon-reload  || true
  fi

  echo "[Unit]" >> $UNIT
  echo "Description=ComfyUI Service" >> $UNIT
  echo "After=network.target" >> $UNIT
  echo "" >> $UNIT
  echo "[Service]" >> $UNIT
  echo "Type=simple" >> $UNIT
  echo "User=root" >> $UNIT
  echo "" >> $UNIT
  echo "ExecStart=${COMFYUI_BIN}" >> $UNIT
  echo "" >> $UNIT
  echo "Restart=on-failure" >> $UNIT
  echo "" >> $UNIT
  echo "[Install]" >> $UNIT
  echo "WantedBy=multi-user.target" >> $UNIT

  $SUDO cp $UNIT $UNIT_SYS
  $SUDO systemctl daemon-reload  || true
  $SUDO systemctl start comfyui  || true

  # Health Check
  echo >&2 'Checking ComfyUI Status'

  n=15
  i=1
  while [ $i -lt $((n+1)) ]; do
    curl -s "http://localhost:8188" > /dev/null
    if [ "$?" = "0" ]; then      
      echo >&2 "ComfyUI Up"
      break
    fi

    echo >&2 "[$i/$n] ComfyUI down, trying again in 1s..."
    if [ "$i" = "$n" ]; then
      echo >&2 "ComfyUI Failed to start in $n seconds"
      break
    fi
    sleep 1
    i=$((i+1))
  done
fi

if [ "$CADDY" = "true" ]; then
  curl --progress-bar -L -o "${OUT_DIR}/bin/bin/caddy" "https://caddyserver.com/api/download?os=linux&arch=amd64&p=github.com%2Fueffel%2Fcaddy-brotli&idempotency=13785720277727"
  chmod +x "${OUT_DIR}/bin/bin/caddy"
  curl --progress-bar -L -o "${OUT_DIR}/bin/bin/Caddyfile" "https://sh.davidalsh.com/assets/comfyui.caddyfile"

  if [ "$SYSTEMD" = "true" ]; then 
    if ! [ -x "$(command -v systemd)" ]; then
      >&2 echo "systemd not available"
      exit 1
    fi

    UNIT="$OUT_DIR/share/comfyui-proxy.service"
    UNIT_SYS="/etc/systemd/system/comfyui-proxy.service"
    
    if [ -f "$UNIT" ]; then
      rm -rf "$UNIT"
    fi

    if [ -f "$UNIT_SYS" ]; then
      $SUDO systemctl stop comfyui-proxy  || true
      $SUDO rm -rf "$UNIT_SYS"
      $SUDO systemctl daemon-reload  || true
    fi

    echo "[Unit]" >> $UNIT
    echo "Description=ComfyUI Proxy" >> $UNIT
    echo "After=network.target" >> $UNIT
    echo "" >> $UNIT
    echo "[Service]" >> $UNIT
    echo "Type=simple" >> $UNIT
    echo "User=root" >> $UNIT
    echo "" >> $UNIT
    echo "ExecStart=${OUT_DIR}/bin/caddy" >> $UNIT
    echo "" >> $UNIT
    echo "Restart=on-failure" >> $UNIT
    echo "" >> $UNIT
    echo "[Install]" >> $UNIT
    echo "WantedBy=multi-user.target" >> $UNIT

    $SUDO cp $UNIT $UNIT_SYS
    $SUDO systemctl daemon-reload  || true
    $SUDO systemctl start comfyui  || true
  fi
fi
