import subprocess
import json
import platform
import socket
import re

def run_command(cmd):
    try:
        result = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT).decode('utf-8', errors='ignore').strip()
        return result
    except Exception:
        return "N/A"

def get_ps_info(cmd):
    ps_cmd = f"powershell -NoProfile -Command \"{cmd}\""
    return run_command(ps_cmd)

def main():
    print("="*60)
    print(" GALPE - EXTRACTOR DE INFORMACIÓN TÉCNICA (WINDOWS)")
    print("="*60)
    print("Obteniendo datos del sistema... por favor espere.")

    # basic info
    hostname = socket.gethostname()
    os_name = f"{platform.system()} {platform.release()} (Build {platform.version()})"
    
    # hardware via powershell/wmic
    cpu = get_ps_info("(Get-CimInstance Win32_Processor).Name")
    ram_raw = get_ps_info("(Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum")
    ram_gb = round(int(ram_raw) / (1024**3)) if ram_raw.isdigit() else "N/A"
    
    serial = get_ps_info("(Get-CimInstance Win32_Bios).SerialNumber")
    mb_brand = get_ps_info("(Get-CimInstance Win32_BaseBoard).Manufacturer")
    mb_model = get_ps_info("(Get-CimInstance Win32_BaseBoard).Product")
    
    # Disks
    disks_raw = get_ps_info("Get-CimInstance Win32_DiskDrive | Select-Object Model, Size, MediaType | ConvertTo-Json")
    disks = []
    try:
        if disks_raw:
            data = json.loads(disks_raw)
            if isinstance(data, dict): data = [data]
            for d in data:
                size_gb = int(d['Size']) // (1024**3) if d.get('Size') else 0
                media = d.get('MediaType', 'Unknown')
                disks.append(f"{d['Model']} ({size_gb}GB) - {media}")
    except:
        disks = ["Error al obtener discos"]

    # Network
    ip = socket.gethostbyname(hostname)
    mac = get_ps_info("(Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object {$_.IPEnabled -eq $true}).MACAddress")
    if isinstance(mac, list): mac = mac[0]

    print("\n" + "-"*60)
    print(f" IDENTIFICACIÓN")
    print(f" Nombre Equipo:   {hostname}")
    print(f" Etiqueta/Serial: {serial}")
    print(f" S.O.:            {os_name}")
    
    print("\n ESPECIFICACIONES (Pestaña Ficha Técnica)")
    print(f" Procesador:      {cpu}")
    print(f" Memoria RAM:     {ram_gb} GB")
    print(f" Placa Base:      {mb_brand} {mb_model}")
    
    print("\n DISCOS:")
    for d in disks:
        print(f" - {d}")
    
    print("\n RED (Pestaña Red/Periféricos)")
    print(f" IP Local:        {ip}")
    print(f" MAC Address:     {mac}")
    print("-"*60)
    print("\nCopia estos datos en la Ficha Técnica de la aplicación.")
    input("\nPresiona Enter para salir...")

if __name__ == "__main__":
    main()
