$jsonPath = "cities.json"
$templatePath = "_template.html"
$guidesDir = "guides"

# 1. Force Strict UTF-8 Encoding (No BOM) - This prevents all web mojibake
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

if (-Not (Test-Path $jsonPath)) { 
    Write-Host "[-] Missing $jsonPath" -ForegroundColor Red
    exit 
}

if (-Not (Test-Path $templatePath)) { 
    Write-Host "[-] Missing $templatePath" -ForegroundColor Red
    exit 
}

if (-Not (Test-Path $guidesDir)) {
    New-Item -ItemType Directory -Path $guidesDir | Out-Null
    Write-Host "[+] Created $guidesDir folder" -ForegroundColor Green
}

# Read JSON Text strictly as UTF-8
$citiesText = [System.IO.File]::ReadAllText((Resolve-Path $jsonPath).Path, $utf8NoBom)

# Convert to PowerShell Object
$cities = $citiesText | ConvertFrom-Json

# Read Template Text strictly as UTF-8
$rawTemplate = [System.IO.File]::ReadAllText((Resolve-Path $templatePath).Path, $utf8NoBom)

$count = 0
foreach ($city in $cities) {
    $slug = $city.slug
    $name = $city.name
    $state = $city.state
    $desc = $city.desc
    $lat = $city.lat
    $lon = $city.lon

    $pageContent = $rawTemplate

    # Fully integrating the template tokens with your established JSON structure
    $pageContent = $pageContent -replace '\{\{CITY_NAME\}\}', $name
    $pageContent = $pageContent -replace '\{\{STATE\}\}', $state
    $pageContent = $pageContent -replace '\{\{LATITUDE\}\}', $lat
    $pageContent = $pageContent -replace '\{\{LONGITUDE\}\}', $lon
    $pageContent = $pageContent -replace '\{\{CITY_SLUG\}\}', $slug
    
    $seoDesc = "Live morning commute weather for $name, $state. Real-time conditions, marine layer fog alerts, rain probability, and local highway visibility for $desc."
    $pageContent = $pageContent -replace '\{\{SEO_DESC\}\}', $seoDesc

    # Write Output strictly as UTF-8
    $outPath = Join-Path $guidesDir $slug
    $absoluteOutPath = Join-Path (Get-Location).Path $outPath
    [System.IO.File]::WriteAllText($absoluteOutPath, $pageContent, $utf8NoBom)
    
    Write-Host "[+] Generated: $outPath ($name, $state)" -ForegroundColor Green
    $count++
}

Write-Host "`n[!] Successfully built $count SEO-optimized city pages inside /$guidesDir/ with perfect UTF-8 encoding!" -ForegroundColor Cyan