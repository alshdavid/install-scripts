[CmdletBinding()]
param (
    $path,
    [switch] $force
)

$dir_target = $path
if ("$dir_target" -eq "") {
    $dir_target = "$env:USERPROFILE\local\uutils"
}
Write-Host "TARTGET DIR: $dir_target"


Write-Host "OS:          $([System.Runtime.InteropServices.RuntimeInformation]::OSDescription)"
$platform = switch -Wildcard ([System.Runtime.InteropServices.RuntimeInformation]::OSDescription) {
  "*Windows*" { "pc-windows-msvc.zip" }
  "*Linux*"   { "unknown-linux-musl.tar.gz" }
  "*Darwin*"  { "apple-darwin.tar.gz" }
  Default     { exit 1 }
}

Write-Host "CPU:         $([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)"
$arch = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture) {
    "X64"  { "x86_64" }
    "X86"  { "i686" }
    "Arm"  { "arm" }
    "Arm64" { "aarch64" }
    Default { 
        Write-Host "Unknown CPU architecture"
        exit 1 
    }
}

$url_api = "https://sh.davidalsh.com/versions/uutils/latest"
Write-Host "URL GitHub:  $url_api"

$response = Invoke-WebRequest -Uri "$url_api" -UseBasicParsing


# if ($force) {
#     Write-Host "ACTION:      Deleting & recreating `"$dir_target`""
# } else {
#     Write-Host -ForegroundColor red -NoNewLine "PROMPT:      Delete & recreate `"$dir_target`" [y/n]"
#     $confirmation = Read-Host
#     if ($confirmation -ne 'y') {
#         exit 0
#     }
# }

# if ( Test-Path "$dir_target" ) {
#     Remove-Item -Force -Recurse $dir_target | Out-Null
# }
# New-Item -ItemType Directory -Force -Path $dir_target | Out-Null

# $path_temp = "$dir_target\.temp"
# $path_archive = "$path_temp\$name_target"
# $name_stripped = "$([io.path]::GetFileNameWithoutExtension("$name_target"))"

# if ( Test-Path "$path_temp" ) {
#     Remove-Item -Recurse -Force "$path_temp"  | Out-Null
# }
# New-Item -ItemType Directory -Force -Path $path_temp | Out-Null

# Write-Host "ACTION:      Downloading archive"
# Invoke-WebRequest $url_target -OutFile "$path_archive"

# Write-Host "ACTION:      Expanding archive"
# switch -wildcard ($url_target){
#     "*.zip" {
#         Expand-Archive "$path_archive" -DestinationPath "$path_temp" | Out-Null
#         Get-ChildItem -Path "$path_temp\$name_stripped" -Recurse | Move-Item -Destination "$dir_target"
#     }
#     "*.tar.gz" {
#         echo "tar.gz"
#     }
#     "*.tar.xz" {
#         echo "tar.xz"
#     }
#     Default { 
#         Write-Host "Unknown archive kind: $url_target"
#         exit 1 
#     }
# }

# $bin_dir = "$dir_target\bin"
# if ( Test-Path "$bin_dir" ) {
#     Remove-Item -Recurse -Force "$bin_dir"  | Out-Null
# }
# New-Item -ItemType "directory" "$bin_dir"  | Out-Null

# New-Item -ItemType SymbolicLink -Path "$bin_dir\coreutils.exe" -Target "$dir_target\coreutils.exe" | Out-Null

# $existing_aliases = ""

# function Check-Command($cmdname)
# {
#     return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
# }

# Foreach ($util in @(. "$bin_dir\coreutils.exe" --list)) { 
#     $target_path = "$bin_dir\$util.exe"
#     $coreutils = "$dir_target\coreutils.exe"

#     Write-Host -Message "LINK:        $coreutils -> $target_path"
#     New-Item -ItemType SymbolicLink -Path "$target_path" -Target "$coreutils" | Out-Null

#     if ("$util" -eq "[") {
#         continue
#     }

#     if (Check-Command $util)
#     {
#         if ("$((Get-Command "$util").CommandType)" -eq "Alias") {
#             $existing_aliases += "Remove-Item Alias:`"$util`" `r`n"
#         }
#     }
# }

# if ( Test-Path "$path_temp" ) {
#     Remove-Item -Recurse -Force "$path_temp"  | Out-Null
# }

# Write-Host ""
# Write-Host "Add this to `$profile:"
# Write-Host ""

# Write-Host "Remove-Item Alias:`"cat`""
# Write-Host "Remove-Item Alias:`"cp`""
# Write-Host "Remove-Item Alias:`"dir`""
# Write-Host "Remove-Item Alias:`"echo`""
# Write-Host "Remove-Item Alias:`"ls`""
# Write-Host "Remove-Item Alias:`"mv`""
# Write-Host "Remove-Item Alias:`"pwd`""
# Write-Host "Remove-Item Alias:`"rm`""
# Write-Host "Remove-Item Alias:`"rmdir`""

# Write-Host ""
# Write-Host "Add this directory to your `$PATH:"
# Write-Host ""
# Write-Host "$dir_target\bin"
