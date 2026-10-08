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
* El contenedor **`meinpets_db`**: instancia local de PostgreSQL 16 con PostGIS y ejecución automática de los scripts en `base-de-datos/scripts/`:
  * `01_init.sql`: habilitación de la extensión `postgis`.
  * `02_schema.sql`: creación del esquema relacional (`usuarios`, `especies`, `razas`, `mascotas`, `usuarios_mascotas`, `catalogo_tratamientos`, `historial_tratamientos` y `establecimientos`) e índices espaciales GiST.
  * `03_seed.sql`: carga inicial idempotente de especies, razas frecuentes, catálogo de vacunas/antiparasitarios y establecimientos de prueba.
* El contenedor **`meinpets_api`**: la API REST conectada a la base de datos con soporte de autenticación mediante hash `bcrypt` y tokens `JWT` (`JWT_SECRET` y `JWT_EXPIRES_IN` definidos en `.env`).

La API queda disponible en `http://localhost:3000` (y bajo el prefijo `http://localhost:3000/api`).

Para comprobar el correcto funcionamiento y la conexión con la base de datos:
- **Ruta de verificación:** `http://localhost:3000/health` (o `http://localhost:3000/api/health`)
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

#### Endpoints de autenticación disponibles
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de usuario (`nombre_completo`, `email`, `password`) con validación de formato, complejidad de clave y hash `bcrypt`. Devuelve `201` o `409` si el correo ya existe. |
| `POST` | `/api/auth/login` | Inicio de sesión (`email`, `password`). Verifica credenciales y emite un token `JWT` junto con los datos públicos del perfil (`200`) o `401` ante credenciales inválidas. |
| `GET` | `/api/auth/me` | Ruta protegida mediante header `Authorization: Bearer <token>`. Devuelve el perfil del usuario autenticado (`200`) o `401` si el token falta, es inválido o expiró. |

Para detener los contenedores:
```bash
docker compose down
```
*(Si ya disponía de un volumen `meinpets_pgdata` creado en un sprint previo y desea reinicializar la base de datos desde cero con los nuevos scripts `02_schema.sql` y `03_seed.sql`, ejecute `docker compose down -v` antes de `docker compose up --build`).*

*(Opcional para desarrollo sin Docker en la API: Si se prefiere ejecutar la API directamente con Node.js (`npm run dev`), cambiar `POSTGRES_HOST=db` por `POSTGRES_HOST=localhost` en el archivo `.env` manteniendo el contenedor de la base de datos activo).*



### Aplicación móvil
El cliente fue desarrollado con React Native y Expo. La forma recomendada de evaluación es en un **dispositivo móvil físico mediante código QR**, ya que permite apreciar la experiencia nativa de la aplicación. De forma alternativa y cómoda para revisión rápida, se incluye la opción de ejecutarla directamente en el **navegador web** de la computadora.

#### 1. Visualización Recomendada: Dispositivo Móvil Físico (Expo Go con QR)
Permite validar el comportamiento nativo, gestos táctiles y transiciones fluidas en teléfono real:

1. **Instalar la aplicación Expo Go** en el celular (Google Play Store en Android o App Store en iOS).
2. **Conectar el teléfono a la misma red Wi-Fi** que la computadora.
3. **Iniciar el servidor de desarrollo:**
   ```bash
   cd "FASE 2/Evidencias Proyecto/Evidencias de sistema/aplicacion/movil"
   npm install   # Solo la primera vez tras clonar
   npm start
   ```
4. **Escanear el código QR generado en la terminal:**
   - **Android:** Abrir **Expo Go** y presionar *"Scan QR code"*.
   - **iOS:** Enfocar el código con la aplicación de la **Cámara** para abrir en Expo Go (en iOS puede ser necesario iniciar sesión con una cuenta de Expo).

Podrá interactuar y navegar entre las pantallas de **Iniciar Sesión**, **Crear Cuenta**, **Mis Mascotas** (con validación de sesión activa JWT y cierre de sesión) y **Mapa**.

---

#### 2. Visualización Alternativa y Cómoda: Navegador Web
Si no se dispone de un dispositivo móvil en el momento o se prefiere una revisión inmediata sin instalaciones adicionales en el teléfono:

```bash
cd "FASE 2/Evidencias Proyecto/Evidencias de sistema/aplicacion/movil"
npm run web
```
*(O presionando la tecla `w` en la consola donde ya se encuentre ejecutando `npm start`).*

La aplicación se abrirá automáticamente en `http://localhost:8081` con soporte completo de navegación entre pantallas (si el puerto está ocupado, se le preguntará si desea usar otro; solo presione la tecla "Enter").


> **Configuración de la API:** La URL del backend se encuentra centralizada en `src/config/api.ts` (`API_CONFIG.BASE_URL`). Para pruebas en un teléfono físico con Expo Go, configure la dirección IPv4 Wi-Fi local del equipo donde corre el servidor (ej. `http://192.168.1.X:3000/api`); para pruebas exclusivamente en navegador web local puede emplearse `http://localhost:3000/api`.





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

## 7. Convención de ramas y flujo de trabajo (Git / Pull Requests)

Para mantener un historial de versiones limpio y garantizar la estabilidad del código, el equipo adopta un flujo basado en dos ramas de largo plazo (`main` y `dev`) y ramas temporales por tarea.

### 7.1 Estructura de ramas principales
- **`main`**: Código estable y probado, representativo de las entregas oficiales del proyecto. Rechaza pushes directos.
- **`dev`**: Rama principal de desarrollo e integración diaria. Contiene los últimos avances validados durante el sprint. Rechaza pushes directos.

---

### 7.2 Nomenclatura de ramas de trabajo
Todas las ramas de trabajo se deben crear obligatoriamente a partir de **`dev`** y seguir la convención:

`<tipo>/sprint<N>/<descripcion-corta>`

#### Tipos de trabajo (`<tipo>`):
- **`feat`**: Desarrollo de nuevas funcionalidades.
- **`fix`**: Corrección de errores o bugs.
- **`db`**: Cambios en la base de datos (scripts DDL, PostGIS, datos iniciales).
- **`docs`**: Documentación (README, manuales, arquitectura).

---

### 7.3 Flujo de trabajo y Pull Requests (PR)

1. **Creación de la rama:**
   Actualiza la rama `dev` e inicia tu trabajo:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b <tipo>/sprint<N>/<descripcion-corta>
   ```

2. **Commits y push:**
   Registra tus cambios con commits descriptivos y publica la rama remota:
   ```bash
   git push origin <tipo>/sprint<N>/<descripcion-corta>
   ```

3. **Pull Request a `dev`:**
   - Abre un PR con destino a la rama **`dev`**.
   - Vincula el PR al Issue correspondiente en GitHub Projects.

4. **Revisión de pares (Code Review):**
   - Todo PR hacia `dev` requiere la revisión y **aprobación de al menos un integrante del equipo** (Javier, Sebastián o Carlos).
   - Una vez aprobado, se realiza el merge a `dev` y se elimina la rama temporal.

5. **Pase a producción / entrega final (`dev` ➔ `main`):**
   - Al finalizar el sprint o hito de entrega, se abre un PR de **`dev` hacia `main`**.
   - Tras la validación final del equipo, se fusiona en `main`.


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
