INSERT INTO especies (nombre)
VALUES ('Perro'), ('Gato')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO razas (especie_id, nombre)
SELECT e.id, r.nombre
FROM (VALUES
    ('Mestizo'),
    ('Labrador Retriever'),
    ('Pastor Alemán'),
    ('Golden Retriever'),
    ('Bulldog Francés'),
    ('Poodle'),
    ('Beagle'),
    ('Chihuahua'),
    ('Yorkshire Terrier'),
    ('Boxer'),
    ('Dachshund'),
    ('Pug')
) AS r(nombre)
CROSS JOIN especies e
WHERE e.nombre = 'Perro'
ON CONFLICT (especie_id, nombre) DO NOTHING;

INSERT INTO razas (especie_id, nombre)
SELECT e.id, r.nombre
FROM (VALUES
    ('Mestizo'),
    ('Siamés'),
    ('Persa'),
    ('Maine Coon'),
    ('Bengala'),
    ('Angora'),
    ('Ragdoll'),
    ('Sphynx'),
    ('British Shorthair')
) AS r(nombre)
CROSS JOIN especies e
WHERE e.nombre = 'Gato'
ON CONFLICT (especie_id, nombre) DO NOTHING;

INSERT INTO catalogo_tratamientos (especie_id, tipo, nombre, dias_sugeridos_refuerzo, es_obligatoria)
SELECT e.id, t.tipo, t.nombre, t.dias_sugeridos_refuerzo, t.es_obligatoria
FROM (VALUES
    ('vacuna', 'Puppy DP (Distemper y Parvovirus)', 21, true),
    ('vacuna', 'Séxtuple Canina', 21, true),
    ('vacuna', 'Antirrábica Canina', 365, true),
    ('vacuna', 'KC (Tos de las Perreras)', 365, false),
    ('antiparasitario_interno', 'Antiparasitario Interno Canino', 90, true),
    ('antiparasitario_externo', 'Antiparasitario Externo Canino', 30, true)
) AS t(tipo, nombre, dias_sugeridos_refuerzo, es_obligatoria)
CROSS JOIN especies e
WHERE e.nombre = 'Perro'
ON CONFLICT (especie_id, nombre, tipo) DO NOTHING;

INSERT INTO catalogo_tratamientos (especie_id, tipo, nombre, dias_sugeridos_refuerzo, es_obligatoria)
SELECT e.id, t.tipo, t.nombre, t.dias_sugeridos_refuerzo, t.es_obligatoria
FROM (VALUES
    ('vacuna', 'Triple Felina', 21, true),
    ('vacuna', 'Leucemia Felina (FeLV)', 21, false),
    ('vacuna', 'Antirrábica Felina', 365, true),
    ('antiparasitario_interno', 'Antiparasitario Interno Felino', 90, true),
    ('antiparasitario_externo', 'Antiparasitario Externo Felino', 30, true)
) AS t(tipo, nombre, dias_sugeridos_refuerzo, es_obligatoria)
CROSS JOIN especies e
WHERE e.nombre = 'Gato'
ON CONFLICT (especie_id, nombre, tipo) DO NOTHING;

INSERT INTO establecimientos (nombre, categoria, direccion, telefono, horario_atencion, ubicacion, contacto_email)
SELECT 'Clínica Veterinaria Central', 'veterinaria', 'Av. Santa Isabel 450, Santiago', '+56 2 2222 1111', '09:00 - 20:00', ST_SetSRID(ST_MakePoint(-70.6482, -33.4513), 4326), 'contacto@vetcentral.cl'
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = 'Clínica Veterinaria Central');

INSERT INTO establecimientos (nombre, categoria, direccion, telefono, horario_atencion, ubicacion, contacto_email)
SELECT 'Hospital Veterinario Urgencias 24h', 'urgencia_24h', 'Av. Providencia 1200, Providencia', '+56 2 2333 4444', '24 Horas', ST_SetSRID(ST_MakePoint(-70.6200, -33.4285), 4326), 'urgencias@vet24h.cl'
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = 'Hospital Veterinario Urgencias 24h');

INSERT INTO establecimientos (nombre, categoria, direccion, telefono, horario_atencion, ubicacion, contacto_email)
SELECT 'Pet Shop y Farmacia Mascotas', 'pet_shop', 'Av. Irarrázaval 2800, Ñuñoa', '+56 2 2444 5555', '10:00 - 19:30', ST_SetSRID(ST_MakePoint(-70.6015, -33.4560), 4326), 'tienda@petfarmacia.cl'
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = 'Pet Shop y Farmacia Mascotas');
