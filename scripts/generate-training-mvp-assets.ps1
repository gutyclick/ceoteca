$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$output = Join-Path $PSScriptRoot "..\public\images\training\mvp"
New-Item -ItemType Directory -Force -Path $output | Out-Null

$scenes = @(
  @{ File = "marca-norte.png"; Title = "NORTE"; Subtitle = "Café de origen"; Accent = "#5B3FD6"; Detail = "Calma, origen, precisión" },
  @{ File = "marca-brio.png"; Title = "BRÍO"; Subtitle = "Energía natural"; Accent = "#00A878"; Detail = "Movimiento, frescura, ritmo" },
  @{ File = "marca-lumen.png"; Title = "LUMEN"; Subtitle = "Estudio creativo"; Accent = "#FF8A00"; Detail = "Ideas claras, trabajo visible" },
  @{ File = "jerarquia-claridad.png"; Title = "ORDEN"; Subtitle = "Una idea primero"; Accent = "#3157E8"; Detail = "Titular > beneficio > acción" },
  @{ File = "jerarquia-ruido.png"; Title = "TODO AHORA"; Subtitle = "Oferta, novedad, descuento"; Accent = "#E33D8F"; Detail = "Cinco mensajes compiten entre sí" },
  @{ File = "propuesta-alba.png"; Title = "ALBA"; Subtitle = "Agenda semanal para equipos pequeños"; Accent = "#7B3FF2"; Detail = "Decide prioridades en 15 minutos" },
  @{ File = "slogan-claro.png"; Title = "TRAZO"; Subtitle = "Diseña menos. Comunica mejor."; Accent = "#0F9FA8"; Detail = "Breve, relevante y verificable" },
  @{ File = "slogan-generico.png"; Title = "TRAZO"; Subtitle = "Tu mejor versión, siempre"; Accent = "#8A94A6"; Detail = "Una promesa sin contexto" },
  @{ File = "anuncio-cauce.png"; Title = "CAUCE"; Subtitle = "Ordena tus cobros sin perseguir facturas"; Accent = "#246BFD"; Detail = "Prueba el tablero con tres clientes" },
  @{ File = "landing-marea.png"; Title = "MAREA"; Subtitle = "Reservas simples para estudios de bienestar"; Accent = "#D94C94"; Detail = "Ver una demostración de 3 minutos" }
)

foreach ($scene in $scenes) {
  $bitmap = New-Object System.Drawing.Bitmap 1200, 760
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(248, 249, 252))

  $accent = [System.Drawing.ColorTranslator]::FromHtml($scene.Accent)
  $ink = [System.Drawing.Color]::FromArgb(20, 28, 48)
  $muted = [System.Drawing.Color]::FromArgb(84, 96, 120)
  $white = [System.Drawing.Color]::White

  $accentBrush = New-Object System.Drawing.SolidBrush $accent
  $inkBrush = New-Object System.Drawing.SolidBrush $ink
  $mutedBrush = New-Object System.Drawing.SolidBrush $muted
  $whiteBrush = New-Object System.Drawing.SolidBrush $white
  $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(220, 225, 235)), 2

  $graphics.FillRectangle($accentBrush, 0, 0, 34, 760)
  $graphics.DrawRectangle($borderPen, 95, 84, 1010, 590)
  $graphics.FillEllipse($accentBrush, 140, 135, 92, 92)
  $graphics.FillRectangle($accentBrush, 810, 145, 220, 16)
  $graphics.FillRectangle($accentBrush, 810, 178, 150, 16)
  $graphics.FillRectangle($accentBrush, 810, 211, 188, 16)

  $titleFont = New-Object System.Drawing.Font "Arial", 66, ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font "Arial", 30, ([System.Drawing.FontStyle]::Bold)
  $detailFont = New-Object System.Drawing.Font "Arial", 22, ([System.Drawing.FontStyle]::Regular)
  $tagFont = New-Object System.Drawing.Font "Arial", 16, ([System.Drawing.FontStyle]::Bold)

  $graphics.DrawString($scene.Title, $titleFont, $inkBrush, 140, 280)
  $graphics.DrawString($scene.Subtitle, $subtitleFont, $inkBrush, 145, 390)
  $graphics.DrawString($scene.Detail, $detailFont, $mutedBrush, 145, 455)
  $graphics.FillRectangle($accentBrush, 145, 545, 250, 52)
  $graphics.DrawString("CASO FICTICIO CEOTECA", $tagFont, $whiteBrush, 164, 559)

  $bitmap.Save((Join-Path $output $scene.File), [System.Drawing.Imaging.ImageFormat]::Png)

  $titleFont.Dispose(); $subtitleFont.Dispose(); $detailFont.Dispose(); $tagFont.Dispose()
  $accentBrush.Dispose(); $inkBrush.Dispose(); $mutedBrush.Dispose(); $whiteBrush.Dispose(); $borderPen.Dispose()
  $graphics.Dispose(); $bitmap.Dispose()
}

Write-Output "Recursos visuales de Training generados en $output"
