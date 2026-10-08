SET client_encoding = 'UTF8';

ALTER TABLE catalogo_tratamientos
ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255);

UPDATE catalogo_tratamientos SET descripcion = 'Distemper y parvovirus' WHERE nombre = 'Puppy DP (Distemper y Parvovirus)';
UPDATE catalogo_tratamientos SET descripcion = 'Protección múltiple' WHERE nombre = 'Séxtuple Canina';
UPDATE catalogo_tratamientos SET descripcion = 'Rabia' WHERE nombre IN ('Antirrábica Canina', 'Antirrábica Felina');
UPDATE catalogo_tratamientos SET descripcion = 'Tos de las perreras' WHERE nombre = 'KC (Tos de las Perreras)';
UPDATE catalogo_tratamientos SET descripcion = 'Gusanos intestinales' WHERE nombre IN ('Antiparasitario Interno Canino', 'Antiparasitario Interno Felino');
UPDATE catalogo_tratamientos SET descripcion = 'Pulgas y garrapatas' WHERE nombre = 'Antiparasitario Externo Canino';
UPDATE catalogo_tratamientos SET descripcion = 'Panleucopenia, calicivirus y rinotraqueítis' WHERE nombre = 'Triple Felina';
UPDATE catalogo_tratamientos SET descripcion = 'Virus de leucemia felina' WHERE nombre = 'Leucemia Felina (FeLV)';
UPDATE catalogo_tratamientos SET descripcion = 'Pulgas y ácaros' WHERE nombre = 'Antiparasitario Externo Felino';
