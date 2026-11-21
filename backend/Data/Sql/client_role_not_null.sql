-- La colonne "role" de "Client" accepte NULL en base alors que le code exige toujours une valeur
-- ("Client" ou "Admin"). Un compte inséré sans rôle (ex. à la main) ne pourrait ni se connecter
-- correctement ni être reconnu par les contrôles d'accès. À exécuter une fois.
BEGIN;

UPDATE "Client" SET role = 'Client' WHERE role IS NULL;

ALTER TABLE "Client" ALTER COLUMN role SET DEFAULT 'Client';
ALTER TABLE "Client" ALTER COLUMN role SET NOT NULL;

-- Garde-fou supplémentaire : seuls ces deux rôles existent.
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS ck_client_role;
ALTER TABLE "Client" ADD CONSTRAINT ck_client_role CHECK (role IN ('Client', 'Admin'));

COMMIT;
