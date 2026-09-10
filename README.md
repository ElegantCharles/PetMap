# MeinPets

<p align="center">
  <img src="assets/logo.png" alt="MeinPets" width="180">
</p>

## 1. Descripción del proyecto
MeinPets es una aplicación móvil para el cuidado y la gestión de la salud de mascotas, orientada a
dueños de perros y gatos de la Región de Valparaíso.

Resuelve dos problemas que hoy quedan sin cubrir. El primero es la falta de un registro
centralizado: la información médica de una mascota vive repartida entre carnets de papel,
fotos en el teléfono y la memoria del dueño. El segundo es la búsqueda de atención: las
aplicaciones de mapas de uso general no distinguen entre una veterinaria, un laboratorio
clínico, una peluquería canina o una tienda de alimentos, por lo que encontrar el servicio
correcto en una urgencia es lento y poco confiable.

La aplicación permite crear un perfil por mascota con sus datos y su historial, llevar el
control de vacunas y desparasitaciones con recordatorios en el calendario del teléfono, y
localizar establecimientos de atención animal cercanos filtrados por categoría.

## 2. Tecnologías utilizadas
- **Lenguajes:** TypeScript
- **Aplicación móvil:** React Native + Expo · MapLibre (mapa) · expo-calendar · expo-location
- **Backend / API:** Node.js + Express
- **Base de datos:** PostgreSQL 16 + PostGIS (contenedor Docker)
- **Datos geográficos:** OpenStreetMap, importados vía Overpass API a PostGIS
- **Cloud / Infraestructura:** Docker + Docker Compose

## 3. Instrucciones para ejecutar el proyecto localmente

### Estructura del repositorio
El repositorio sigue la estructura por fases de la asignatura. El sistema se ejecuta desde
`FASE 2/Evidencias Proyecto/Evidencias de sistema/`.

```
FASE 1/
  Evidencias Grupales/          Formativa y Guía de definición del proyecto
  Evidencias Individuales/      Autoevaluaciones y diarios de reflexión
FASE 2/
  Evidencias Grupales/          Guías e informes de avance y final
  Evidencias Individuales/      Diarios de reflexión y autoevaluaciones
  Evidencias Proyecto/
    Presentacion Proyecto/
    Evidencias de documentacion/
      arquitectura/             Modelo de arquitectura 4+1
      api/                      Documentación de los endpoints
      manual-de-usuario/
    Evidencias de sistema/
      aplicacion/
        movil/                  Aplicación React Native (Expo)
        api/                    API REST (Node.js + Express)
      base-de-datos/
        scripts/                DDL, datos iniciales e importación desde OpenStreetMap
        modelo/                 Diagrama entidad-relación
      docker-compose.yml
      .env.example
FASE 3/
  Evidencias Grupales/          Presentación final
  Evidencias Individuales/      Diarios de reflexión y autoevaluaciones
assets/                         Logo e imágenes del proyecto
README.md
```

### Requisitos previos
- Docker Desktop (en ejecución) y Docker Compose
- Node.js 20 o superior

### Servidor (API + base de datos)
El entorno de desarrollo y evaluación se ejecuta de forma local y autónoma mediante Docker Compose.

```bash
# 1. Clonar el repositorio y entrar a la carpeta del sistema
git clone https://github.com/ElegantCharles/PetMap.git
cd "PetMap/FASE 2/Evidencias Proyecto/Evidencias de sistema"

# 2. Variables de entorno (copiar el ejemplo preconfigurado)
cp .env.example .env
# En Windows (PowerShell): Copy-Item .env.example .env
# En Windows (CMD): copy .env.example .env

# 3. Levantar la API y la base de datos con Docker Compose
docker compose up --build
```
Esto levantará automáticamente:
* El contenedor **`meinpets_db`**: instancia local de PostgreSQL 16 con PostGIS y ejecución automática del script inicial `01_init.sql`.
* El contenedor **`meinpets_api`**: la API REST conectada a la base de datos.

La API queda disponible en `http://localhost:3000`.

Para comprobar el correcto funcionamiento y la conexión con la base de datos:
- **Ruta de verificación:** `http://localhost:3000/health`
- **Respuesta esperada:**
  ```json
  {
    "status": "ok",
    "timestamp": "...",
    "database": {
      "connected": true,
      "postgis": "3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1"
    }
  }
  ```

Para detener los contenedores:
```bash
docker compose down
```

*(Opcional para desarrollo sin Docker en la API: Si se prefiere ejecutar la API directamente con Node.js (`npm run dev`), cambiar `POSTGRES_HOST=db` por `POSTGRES_HOST=localhost` en el archivo `.env` manteniendo el contenedor de la base de datos activo).*



### Aplicación cliente (Web y Móvil)
El cliente fue desarrollado con React Native y Expo. Para facilitar la revisión sin requerir instalaciones en teléfonos personales, **la vía principal de visualización es a través del navegador web**. La ejecución en dispositivo móvil físico mediante Expo Go queda disponible como alternativa opcional.

#### 1. Visualización Principal: Navegador Web
Permite interactuar con la interfaz y probar el flujo de navegación de inmediato en el navegador del computador:

```bash
# 1. Ingresar a la carpeta de la aplicación
cd mobile

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Iniciar en el navegador web
npm run web
```
La aplicación se abrirá automáticamente en `http://localhost:8081` (o presionando la tecla `w` en la consola de Expo), permitiendo navegar entre las pantallas de **Acceso**, **Mascotas** y **Mapa**.

---

#### 2. Visualización Opcional: Dispositivo Móvil Físico (Expo Go)
Para validar el comportamiento en un teléfono real con transiciones nativas:

1. Instalar la aplicación **Expo Go** en el celular (Google Play Store en Android o App Store en iOS, en algunos casos quizas deba iniciar sesion).
2. Conectar el teléfono a la **misma red Wi-Fi** que la computadora.
3. Iniciar el servidor Metro:
   ```bash
   npm start
   ```
4. Escanear el código QR generado en la terminal:
   - **Android:** Abrir **Expo Go** y pulsar *"Scan QR code"*.
   - **iOS:** Enfocar el código con la app de la **Cámara**.

> **Configuración de la API:** La URL del backend se encuentra centralizada en `mobile/src/config/api.ts` (`API_CONFIG.BASE_URL`).



## 4. Integrantes del equipo y roles
| Integrante | Rol |
|---|---|
| Malhue, Javier |Líder de proyecto y base de datos. Coordina al equipo, representa al grupo ante la docente, diseña y gestiona el modelo de base de datos. |
| Altamirano, Sebastian | Control de calidad y pruebas. Define los casos de prueba, valida cada entrega y detecta errores antes de la revisión. |
| Echeverria, Carlos | Desarrollo backend y frontend. Construye la API, la aplicación móvil y el despliegue en la nube. |

## 5. Metodología de trabajo
Scrum, con sprints de una semana. Cada sprint cierra en la sesión semanal con la docente, que
funciona como revisión de avance. El trabajo se organiza en un tablero de GitHub Projects y el
código se versiona en este repositorio.

Cada sprint contempla cuatro etapas:

1. **Planificación** — definición de historias de usuario a partir del backlog.
2. **Desarrollo e integración** — codificación modular de las funcionalidades priorizadas.
3. **Revisión y pruebas** — validación de cada módulo antes de darlo por terminado.
4. **Retroalimentación y ajustes** — corrección de errores y mejoras de la experiencia de uso.

El semestre se divide en tres fases: definición del proyecto, desarrollo incremental por módulos
y cierre con validación y presentación final.

## 6. Arquitectura de la solución
La solución sigue una arquitectura cliente-servidor de tres capas:

```
  Aplicación móvil            API REST                Base de datos
  React Native + Expo   ──►   Node.js + Express  ──►  PostgreSQL + PostGIS
        │                          │
        │                          └── consultas geoespaciales por cercanía
        │
        ├── calendario del dispositivo (recordatorios de vacunas)
        ├── mapa MapLibre sobre OpenStreetMap
        └── enlaces profundos a Google Maps (navegación y reseñas)
```

La API y la base de datos se ejecutan como contenedores definidos en `docker-compose.yml`. La
aplicación móvil se compila e instala en el dispositivo y consume la API por red.

La arquitectura se documenta con el modelo **4+1** (vistas lógica, de procesos, de desarrollo,
física y de escenarios) en `FASE 2/Evidencias Proyecto/Evidencias de documentacion/arquitectura/`,
junto con la descripción de los endpoints de la API.

Los establecimientos de atención animal se importan una única vez desde OpenStreetMap hacia
PostGIS, lo que permite realizar las búsquedas por cercanía sobre la base de datos propia sin
depender de servicios externos en tiempo de ejecución.

---
### Sección de innovación (documento de cierre)
- **¿Qué problema resuelve?** La gestión dispersa de la información de salud de una mascota y la
  dificultad para encontrar el tipo correcto de servicio veterinario en las cercanías.
- **¿Qué hace diferente a la solución?** Combina el historial de salud de la mascota con un
  buscador que distingue entre veterinaria, laboratorio clínico, peluquería y tienda, categorías
  que las aplicaciones de mapas de uso general no separan. Los recordatorios de vacunación se
  integran con el calendario que el usuario ya utiliza, en lugar de vivir aislados en la
  aplicación.
- **¿Qué valor agrega?** Reduce el tiempo de búsqueda de atención en situaciones de urgencia y
  evita que se pierdan controles de vacunación y desparasitación por falta de registro.
