@echo off

$target = $args[0]
. "${PSScriptRoot}\..\${target}\install.ps1"
