# MeinPets

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
- **Cloud / Infraestructura:** Docker + Docker Compose · Oracle Cloud — Ampere A1 Always Free (ARM)

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
README.md
```

### Requisitos previos
- Docker y Docker Compose
- Node.js 20 o superior

### Servidor (API + base de datos)
```bash
# 1. Clonar el repositorio
git clone https://github.com/ElegantCharles/PetMap.git
cd "PetMap/FASE 2/Evidencias Proyecto/Evidencias de sistema"

# 2. Variables de entorno (copiar el ejemplo y completar)
cp .env.example .env

# 3. Levantar la API y la base de datos
docker compose up --build
```
La API queda disponible en `http://localhost:3000`.

### Aplicación móvil


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
