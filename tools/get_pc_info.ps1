$ErrorActionPreference = "SilentlyContinue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " GALPE - EXTRACTOR DE INFORMACIÓN TÉCNICA (COMPATIBLE) " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Obteniendo datos del sistema... por favor espere."

# 1. Identificación básica
$hostname = $env:COMPUTERNAME
$bios = Get-WmiObject Win32_Bios
$serial = $bios.SerialNumber
$osObj = Get-WmiObject Win32_OperatingSystem
$osName = $osObj.Caption + " (Build " + $osObj.BuildNumber + ")"

# 2. Hardware
$cpuObj = Get-WmiObject Win32_Processor
$cpu = $cpuObj.Name
if ($cpuObj -is [array]) { $cpu = $cpuObj[0].Name }

$ramRaw = (Get-WmiObject Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum
$ramGB = [Math]::Round($ramRaw / 1073741824)
$mb = Get-WmiObject Win32_BaseBoard
$mbBrand = $mb.Manufacturer
$mbModel = $mb.Product

# 3. Discos
$disksRaw = Get-WmiObject Win32_DiskDrive
$diskList = @()
foreach ($d in $disksRaw) {
    $size = [Math]::Floor($d.Size / 1073741824)
    $diskList += " - " + $d.Model + " (" + $size + " GB) - " + $d.MediaType
}

# 4. Red
$net = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
$ip = "N/A"
$mac = "N/A"
if ($net -is [array]) { 
    $ip = $net[0].IPAddress[0]
    $mac = $net[0].MACAddress
}
elseif ($net) {
    $ip = $net.IPAddress[0]
    $mac = $net.MACAddress
}

Write-Host ""
Write-Host "------------------------------------------------------------"
Write-Host " IDENTIFICACIÓN" -ForegroundColor Green
Write-Host (" Nombre Equipo:   " + $hostname)
Write-Host (" Etiqueta/Serial: " + $serial)
Write-Host (" S.O.:            " + $osName)

Write-Host ""
Write-Host " ESPECIFICACIONES (Pestaña Ficha Técnica)" -ForegroundColor Green
Write-Host (" Procesador:      " + $cpu)
Write-Host (" Memoria RAM:     " + $ramGB + " GB")
Write-Host (" Placa Base:      " + $mbBrand + " " + $mbModel)

Write-Host ""
Write-Host " DISCOS:" -ForegroundColor Green
foreach ($item in $diskList) { Write-Host $item }

Write-Host ""
Write-Host " RED (Pestaña Red/Periféricos)" -ForegroundColor Green
Write-Host (" IP Local:        " + $ip)
Write-Host (" MAC Address:     " + $mac)
Write-Host "------------------------------------------------------------"

Write-Host ""
Write-Host "Copia estos datos en la Ficha Técnica de la aplicación."
Read-Host "Presiona Enter para salir..."
