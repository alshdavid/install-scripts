<article>
<h3>comfyui.bash</h3>



<h4>AMD</h4>
<code>
curl -sSf "sh.davidalsh.com/comfyui.bash" | bash -s -- --gpu=amd --platform=gfx120X-all
</code>

<h4>NVIDIA</h4>
<code>
curl -sSf "sh.davidalsh.com/comfyui.bash" | bash -s -- --gpu=nvidia --platform=cu118
</code>

<h4>CPU</h4>
<code>
curl -sSf "sh.davidalsh.com/comfyui.bash" | bash -s -- --gpu=cpu
</code>

<h4>Options</h4>
<pre><code>--gpu 
  [amd, nvidia, cpu] 
  graphics card to install pytorch with

--platform 
  [gfx110X-dgpu, gfx1151, gfx120X-all, gfx94X-dcgpu, gfx950-dcgpu, cu118, cu126, cu128]
  Pytorch backend to install

--pre 
  [optional] 
  Install pytorch with --pre flag

--out-dir 
  [FILEPATH] [default: $PWD/ComfyUI] 
  Target directory to install ComfyUI into

--systemd 
  [optional] 
  Linux only, setup a systemd unit to run ComfyUI as a background process

--modify-path
  [optional] 
  Add comfyui command to .zshrc and .bashrc
</code></pre>
</article>

<h4>Uninstall</h4>

<p>Simply delete the ComfyUI folder</p>
<code>
rm -rf /path/to/comfyui
</code>

<p>If you added comfyui to path then you need to remove the directory from your bash profile</p>
<pre><code>
nano $HOME/.zshrc
nano $HOME/.bashrc
</code></pre>

<h4>Windows</h4>

<ul>
  <li><a href="https://git-scm.com/downloads/win">Install Git for windows</a></li>
  <li>Open git bash from start menu</li>
  <li>Run command above</li>
  <li>Open install directory and double click on <code class="inline-block">ComfyUI</code></li>
  <li>You can create a shortcut to <code class="inline-block">ComfyUI</code> in your start menu or desktop</li>
</ul>

<p><i>Note: I'll probably make a powershell script one day so you don't need git bash</i></p>
