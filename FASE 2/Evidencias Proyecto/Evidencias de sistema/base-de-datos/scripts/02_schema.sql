CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS especies (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS razas (
    id SERIAL PRIMARY KEY,
    especie_id INTEGER NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_razas_especie_nombre UNIQUE (especie_id, nombre)
);

CREATE TABLE IF NOT EXISTS mascotas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie_id INTEGER NOT NULL REFERENCES especies(id) ON DELETE RESTRICT,
    raza_id INTEGER REFERENCES razas(id) ON DELETE SET NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    esterilizado BOOLEAN NOT NULL DEFAULT FALSE,
    numero_chip VARCHAR(50),
    foto_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios_mascotas (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mascota_id INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    es_tutor_principal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, mascota_id)
);

CREATE TABLE IF NOT EXISTS catalogo_tratamientos (
    id SERIAL PRIMARY KEY,
    especie_id INTEGER NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('vacuna', 'antiparasitario_interno', 'antiparasitario_externo')),
    nombre VARCHAR(100) NOT NULL,
    dias_sugeridos_refuerzo INTEGER,
    es_obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_catalogo_tratamiento UNIQUE (especie_id, nombre, tipo)
);

CREATE TABLE IF NOT EXISTS historial_tratamientos (
    id SERIAL PRIMARY KEY,
    mascota_id INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    tratamiento_id INTEGER NOT NULL REFERENCES catalogo_tratamientos(id) ON DELETE RESTRICT,
    numero_dosis INTEGER NOT NULL DEFAULT 1,
    fecha_aplicacion DATE NOT NULL,
    fecha_proximo_refuerzo DATE,
    veterinario_nombre VARCHAR(100),
    clinica_nombre VARCHAR(150),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS establecimientos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('veterinaria', 'urgencia_24h', 'pet_shop', 'farmacia_veterinaria')),
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    horario_atencion VARCHAR(150),
    ubicacion GEOMETRY(Point, 4326) NOT NULL,
    contacto_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_razas_especie_id ON razas(especie_id);
CREATE INDEX IF NOT EXISTS idx_mascotas_especie_id ON mascotas(especie_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_mascotas_usuario ON usuarios_mascotas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_mascotas_mascota ON usuarios_mascotas(mascota_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_tratamientos_especie ON catalogo_tratamientos(especie_id);
CREATE INDEX IF NOT EXISTS idx_historial_tratamientos_mascota ON historial_tratamientos(mascota_id);
CREATE INDEX IF NOT EXISTS idx_historial_tratamientos_fecha ON historial_tratamientos(fecha_proximo_refuerzo);
CREATE INDEX IF NOT EXISTS idx_establecimientos_ubicacion ON establecimientos USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_establecimientos_categoria ON establecimientos(categoria);
