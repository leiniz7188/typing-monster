# -*- coding: utf-8 -*-
"""打字小怪兽 · 局域网启动（在家里用 iPad / 平板玩）

双击 start-ipad.bat 即可。会打印两个地址：
    电脑：http://127.0.0.1:8321
    平板：http://<本机局域网 IP>:8321   ← 在 iPad 的 Safari 里输入这个

和 start.bat 的区别只有一个：监听 0.0.0.0 而不是 127.0.0.1，
所以同一个 WiFi 下的其他设备也能访问。
"""

import functools
import http.server
import socket
import socketserver
import sys
from pathlib import Path

PORT = 8321
ROOT = Path(__file__).resolve().parent


def lan_ip() -> str:
    """取本机在局域网里的地址（UDP connect 不会真的发包，只用来选出口网卡）"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("223.5.5.5", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main() -> None:
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    try:
        httpd = socketserver.ThreadingTCPServer(("0.0.0.0", port), handler)
    except OSError:
        print(f"端口 {port} 已被占用。多半是已经有一个窗口在跑，")
        print(f"或者换个端口：  python serve.py 8322")
        input("按回车关闭")
        return

    ip = lan_ip()
    print("=" * 56)
    print("  打字小怪兽 已启动（同一 WiFi 的平板也能打开）")
    print(f"  电脑上玩： http://127.0.0.1:{port}")
    print(f"  平板上玩： http://{ip}:{port}")
    print("=" * 56)
    print("  iPad 前提：① 跟电脑连同一个 WiFi")
    print("             ② 接实体键盘（妙控键盘 / 蓝牙键盘），触屏打不了字")
    print("  首次启动若弹出 Windows 防火墙提示，请勾选「专用 + 公用」并允许")
    print("  关掉这个窗口 = 停止服务（浏览器里的存档不受影响）")
    print()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
