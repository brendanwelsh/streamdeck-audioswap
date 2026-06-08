# Print the current default playback device's full name. The plugin maps it to the matching
# configured device label (Device A / Device B) for the dial display.
Import-Module AudioDeviceCmdlets -ErrorAction SilentlyContinue
(Get-AudioDevice -Playback).Name
