# sync-public.ps1 — 把打字游戏源码同步到 public/ 发布目录，并给站内 URL 注入分享码
# 背景：内置托管按请求校验 sharecode，浏览器加载页面时相对路径引用不带码会被 403（页面裸奔）。
#       根目录源码保持干净（本地 file:// / serve.py 用法不受影响），只在发布副本里注入。
# 用法：改完根目录源码后，双击「同步发布.cmd」或手动跑本脚本；之后再经发布工具上线。
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$shareCode = 'DNW4DOVJUL'   # 与发布平台一致；换码改这里

$utf8 = New-Object System.Text.UTF8Encoding($false)   # 无 BOM，与源文件一致

Write-Output '========================================'
Write-Output ' 打字小怪兽 - 同步发布目录'
Write-Output '========================================'

# ---------- 1. 拷贝源码到 public/ ----------
if (-not (Test-Path "$root\public")) { New-Item -ItemType Directory -Path "$root\public" | Out-Null }
foreach ($f in @('index.html', 'style.css', 'game.js', 'levels.js')) {
    Copy-Item "$root\$f" "$root\public\$f" -Force
}
Write-Output '[1/3] 已拷贝 4 个源码文件到 public/'

# ---------- 2. 给 index.html 的站内引用注入分享码 ----------
$htmlPath = "$root\public\index.html"
$html = [System.IO.File]::ReadAllText($htmlPath, $utf8)

# 先剥掉旧的 sharecode 参数（保证幂等），再统一拼
$html = [regex]::Replace($html, '([a-zA-Z0-9_./-]+)\?sharecode=[^"#\s]*', '$1')
# 只处理 href/src 里的站内相对路径：跳过 data:、http(s):、#、/ 开头和已带码的
$html = [regex]::Replace($html, '(href|src)="([^"]+)"', {
    param($m)
    $attr = $m.Groups[1].Value
    $url = $m.Groups[2].Value
    if ($url -match '^(data:|https?:|#|/|\?|mailto:|javascript:)') { return $m.Value }
    if ($url -match '\?') { return $m.Value }   # 已带其它 query 的不碰
    return $attr + '="' + $url + '?sharecode=' + $shareCode + '"'
})
[System.IO.File]::WriteAllText($htmlPath, $html, $utf8)

$injected = ([regex]::Matches($html, 'sharecode=' + $shareCode)).Count
Write-Output "[2/3] 已注入分享码：$injected 处站内引用"

# ---------- 3. 校验 ----------
$refs = @('style.css', 'game.js', 'levels.js')
$missing = @()
foreach ($r in $refs) {
    if ($html -notmatch ('(?m)^.*' + [regex]::Escape($r) + '\?sharecode=' + [regex]::Escape($shareCode))) {
        $missing += $r
    }
}
if ($missing.Count -gt 0) {
    Write-Output "  [X] 以下引用未注入成功：$($missing -join ', ')"
    exit 1
}
$bad = ([regex]::Matches($html, 'sharecode=[^"]*sharecode')).Count
if ($bad -gt 0) {
    Write-Output '  [X] 检测到重复拼接，注入逻辑有 bug'
    exit 1
}
Write-Output '[3/3] 校验通过：3 处引用全部带码，无重复拼接'
Write-Output ''
Write-Output '完成。下一步：经发布工具重新上线（链接不变）。'
Write-Output '本地试玩不受影响：直接开根目录 index.html 或跑 start.bat。'
