-- Table des inscriptions newsletter (voir Models/AbonneNewsletter.cs).
-- À exécuter une fois sur la base PostgreSQL (extension citext déjà requise par la table "Client").
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS "Abonne_Newsletter" (
    id          uuid        PRIMARY KEY,
    email       citext      NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Abonne_Newsletter_email" ON "Abonne_Newsletter" (email);
