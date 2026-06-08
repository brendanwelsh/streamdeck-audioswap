using System;
using System.Runtime.InteropServices;
class V {
    [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, IntPtr extra);
    const byte VK_VOLUME_DOWN = 0xAE, VK_VOLUME_UP = 0xAF;
    const uint KEYUP = 0x0002;
    static void Main(string[] a) {
        byte vk = (a.Length > 0 && a[0] == "down") ? VK_VOLUME_DOWN : VK_VOLUME_UP;
        int n = 1; if (a.Length > 1) int.TryParse(a[1], out n);
        if (n < 1) n = 1; if (n > 15) n = 15;
        for (int i = 0; i < n; i++) { keybd_event(vk, 0, 0, IntPtr.Zero); keybd_event(vk, 0, KEYUP, IntPtr.Zero); }
    }
}
