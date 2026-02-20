# CORE Galpe - Gestión Ágil de Equipos y Soporte Tecnico

Sistema integral para la gestión, auditoría y control de inventario de equipos informáticos, consumibles y soporte técnico, desarrollado para **Galpe 2021 C.A.**

![SvelteKit](https://img.shields.io/badge/sveltekit-%2320232a.svg?style=for-the-badge&logo=svelte&logoColor=FF3E00)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## 📋 Características Principales

- **Inventario Autómatizado:** Scripts (`.vbs`, `.ps1`) incluidos en la carpeta `/tools` para la extracción automática de especificaciones de hardware en equipos Windows y carga directa a la base de datos de manera remota a través de API.
- **Soporte Técnico (Tickets):** Módulo para la creación, asignación y resolución de tickets de soporte técnico de los usuarios hacia el departamento de sistemas.
- **Gestión de Mantenimiento:** Programación y seguimiento de mantenimientos preventivos y correctivos, incluyendo el consumo automático de stock de consumibles.
- **Gestión de Stock:** Control de entrada y salida de consumibles y repuestos tecnológicos (toners, discos, teclados).
- **Sistema de Permisos (DRBAC):** Roles dinámicos con permisos sumamente granulares sobre la lectura, escritura y eliminación en todos los módulos de la aplicación.
- **Auditoría:** Registro automático de quién, cuándo y qué se modificó en la base de datos.
- **Dashboard Estadístico:** Visualización en tiempo real del estado general del parque tecnológico de la empresa.

## 🚀 Tecnologías Utilizadas

- **Frontend / Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5 con Runes)
- **Estilos / UI:** [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism design system) e Iconos por [Lucide Svelte](https://lucide.dev/)
- **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS Policies)
- **Deployment:** Preparado con `@sveltejs/adapter-vercel` para despliegue nativo en Vercel.

## 🛠️ Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/usuario/core-galpe.git
   cd core-galpe
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto y agrega tus credenciales de Supabase:
   ```env
   PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
   PUBLIC_SUPABASE_ANON_KEY="tu-clave-anonima"
   ```

4. **Levantar el servicio de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

## 📡 Despliegue en la Nube (Vercel)

El proyecto ya está configurado para un despliegue sin problemas en Vercel.

1. Sube tu código a GitHub.
2. Inicia un nuevo proyecto en Vercel y enlaza el repositorio.
3. El `Framework Preset` será detectado automáticamente como **SvelteKit**.
4. ¡IMPORTANTE! Ve a la sección de **Environment Variables** en Vercel y añade:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
5. Haz clic en **Deploy**.

## 💻 Automatización de Escaneo de Equipos

En la carpeta `tools` se encuentra el archivo `get_pc_info.vbs`.
Para usarlo en producción, asegúrate de que la variable `ApiUrl` dentro del script apunte a la URL de tu despliegue en Vercel:

```vbscript
' CONFIGURACION
ScannerKey = "galpe_secure_scan_2026"
ApiUrl = "https://core-galpe.vercel.app/api/scans" 
```

**Uso local:** El técnico solo ejecuta este archivo nativamente (con doble clic) en el sistema Windows del usuario. El script tomará todos los datos de hardware del PC y los subirá por POST a la base de datos sin interacción manual.
