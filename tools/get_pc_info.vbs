' ============================================================
' GALPE - EXTRACTOR DE INFORMACION TECNICA (CON AUTO-CARGA)
' ============================================================

On Error Resume Next

' CONFIGURACION
ScannerKey = "galpe_secure_scan_2026"
' ApiUrl = "https://192.168.88.166:5173/api/scans" 
ApiUrl = "https://core.galpe2021.com/api/scans" 

Function GetInput(prompt, title)
    If LCase(Right(WScript.FullName, 11)) = "cscript.exe" Then
        WScript.StdOut.Write prompt & ": "
        GetInput = WScript.StdIn.ReadLine
    Else
        GetInput = InputBox(prompt, title)
    End If
End Function

Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")
If Err.Number <> 0 Then
    WScript.Echo "Error: No se pudo conectar a WMI."
    WScript.Quit
End If

' 1. Identificación básica
Dim hostname, osName, serial
hostname = CreateObject("WScript.Network").ComputerName

Set colOS = objWMIService.ExecQuery("Select * from Win32_OperatingSystem")
For Each objOS in colOS
    osName = objOS.Caption & " (Build " & objOS.BuildNumber & ")"
Next

Set colBIOS = objWMIService.ExecQuery("Select * from Win32_BIOS")
For Each objB in colBIOS
    serial = objB.SerialNumber
Next

' 2. Hardware
Dim cpu, ramGB
Set colCPU = objWMIService.ExecQuery("Select * from Win32_Processor")
For Each objC in colCPU
    cpu = objC.Name
Next

longTotalMem = 0
Set colMem = objWMIService.ExecQuery("Select * from Win32_PhysicalMemory")
For Each objM in colMem
    longTotalMem = longTotalMem + CDbl(objM.Capacity)
Next
ramGB = Round(longTotalMem / (1024^3))

' 3. Discos
Dim disks
disks = ""
Set colDisks = objWMIService.ExecQuery("Select * from Win32_DiskDrive")
For Each objD in colDisks
    diskSize = Int(CDbl(objD.Size) / (1024^3))
    disks = disks & objD.Model & " (" & diskSize & " GB) - " & objD.MediaType & " | "
Next

' 4. Red
Dim ip, mac
Set colNet = objWMIService.ExecQuery("Select * from Win32_NetworkAdapterConfiguration Where IPEnabled = True")
For Each objNet in colNet
    If Not IsNull(objNet.IPAddress) Then
        ip = objNet.IPAddress(0)
        mac = objNet.MACAddress
        Exit For
    End If
Next

' 5. Datos de Monitor
Dim monitorModel, monitorSerial
monitorModel = "N/A"
monitorSerial = "N/A"

Set objWMIServiceWMI = GetObject("winmgmts:\\.\root\wmi")
Set colMonitors = objWMIServiceWMI.ExecQuery("Select * from WmiMonitorID")

For Each objM In colMonitors
    monitorModel = DecodeWmi(objM.UserFriendlyName)
    monitorSerial = DecodeWmi(objM.SerialNumberID)
    Exit For
Next

Function DecodeWmi(bytes)
    Dim s, i
    s = ""
    If IsNull(bytes) Then
        DecodeWmi = ""
    Else
        For i = LBound(bytes) To UBound(bytes)
            If bytes(i) = 0 Then Exit For
            s = s & Chr(bytes(i))
        Next
        DecodeWmi = Trim(s)
    End If
End Function

' 6. Impresoras
Dim printers
printers = ""
Set colPrinters = objWMIService.ExecQuery("Select * from Win32_Printer")
For Each objP in colPrinters
    printers = printers & objP.Name & " | "
Next
If printers = "" Then printers = "Ninguna detectada"

' 7. Solicitar datos adicionales
Dim scannerEmail, assetTag, respName, respEmail

WScript.Echo "=== DATOS REQUERIDOS ==="
scannerEmail = GetInput("Ingrese SU CORREO (Auditor)", "GALPE")
If scannerEmail = "" Then scannerEmail = "desconocido@galpe.com"

WScript.Echo vbCrLf & "=== INVENTARIO DETECTADO ==="
WScript.Echo "Equipo:     " & hostname
WScript.Echo "Serial:     " & serial
WScript.Echo "CPUs:       " & cpu
WScript.Echo "RAM:        " & ramGB & " GB"
WScript.Echo "Monitor:    " & monitorModel & " (" & monitorSerial & ")"
WScript.Echo "Impresoras: " & printers
WScript.Echo "============================" & vbCrLf

assetTag = GetInput("Ingrese ETIQUETA DE ACTIVO (Asset Tag)", "GALPE")
respName = GetInput("Nombre del RESPONSABLE / USUARIO", "GALPE")
respEmail = GetInput("Correo del RESPONSABLE (Opcional)", "GALPE")

If assetTag = "" Then assetTag = "N/A"
If respName = "" Then respName = "N/A"
If respEmail = "" Then respEmail = "N/A"

' 8. Cargar en Supabase
WScript.Echo vbCrLf & "Cargando en el sistema... "

Function EscapeJSON(ByVal sText)
    If IsNull(sText) Then
        EscapeJSON = "N/A"
        Exit Function
    End If
    Dim sOutput
    sOutput = sText
    sOutput = Replace(sOutput, "\", "\\")
    sOutput = Replace(sOutput, """", "\""")
    sOutput = Replace(sOutput, vbCrLf, "\n")
    sOutput = Replace(sOutput, vbCr, "\n")
    sOutput = Replace(sOutput, vbLf, "\n")
    sOutput = Replace(sOutput, vbTab, "\t")
    EscapeJSON = Trim(sOutput)
End Function

If IsNull(hostname) Then hostname = "N/A"
If IsNull(serial) Then serial = "N/A"
If IsNull(cpu) Then cpu = "N/A"
If IsNull(ip) Then ip = "N/A"
If IsNull(mac) Then mac = "N/A"

Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP")
JSON = "{" & _
    """hostname"": """ & EscapeJSON(hostname) & """, " & _
    """serial_number"": """ & EscapeJSON(serial) & """, " & _
    """cpu"": """ & EscapeJSON(cpu) & """, " & _
    """ram_gb"": " & ramGB & ", " & _
    """disks"": """ & EscapeJSON(disks) & """, " & _
    """ip_address"": """ & EscapeJSON(ip) & """, " & _
    """mac_address"": """ & EscapeJSON(mac) & """, " & _
    """asset_tag"": """ & EscapeJSON(assetTag) & """, " & _
    """responsible_name"": """ & EscapeJSON(respName) & """, " & _
    """responsible_email"": """ & EscapeJSON(respEmail) & """, " & _
    """scanner_user_email"": """ & EscapeJSON(scannerEmail) & """, " & _
    """monitor_model"": """ & EscapeJSON(monitorModel) & """, " & _
    """monitor_serial"": """ & EscapeJSON(monitorSerial) & """, " & _
    """printer_info"": """ & EscapeJSON(printers) & """" & _
    "}"

objHTTP.Open "POST", ApiUrl, False
objHTTP.SetRequestHeader "Content-Type", "application/json"
objHTTP.SetRequestHeader "X-Scanner-Key", ScannerKey
objHTTP.Send JSON

If Err.Number <> 0 Then
    WScript.Echo "Error de conexion: " & Err.Description
Else
    If objHTTP.Status = 200 Or objHTTP.Status = 201 Then
        WScript.Echo "OK: Equipo registrado con exito."
    Else
        WScript.Echo "Error (" & objHTTP.Status & "): " & objHTTP.ResponseText
    End If
End If

WScript.Echo vbCrLf & "Escaneo completado. Presiona Enter para cerrar."
WScript.StdIn.Readline
