CREATE TABLE IF NOT EXISTS public."Paiement" (
    id uuid PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public."Client" (id) ON DELETE RESTRICT,
    request_key uuid NOT NULL,
    saspay_checkout_id character varying(100),
    checkout_url text,
    montant numeric(10,2) NOT NULL,
    devise character varying(3) NOT NULL DEFAULT 'XAF',
    statut character varying(20) NOT NULL DEFAULT 'PENDING',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_paiement_client_request_key
    ON public."Paiement" (client_id, request_key);

CREATE UNIQUE INDEX IF NOT EXISTS ix_paiement_saspay_checkout_id
    ON public."Paiement" (saspay_checkout_id);

ALTER TABLE public."Demande_Produit"
    ADD COLUMN IF NOT EXISTS paiement_id uuid REFERENCES public."Paiement" (id) ON DELETE RESTRICT;

ALTER TABLE public."Demande_Service"
    ADD COLUMN IF NOT EXISTS paiement_id uuid REFERENCES public."Paiement" (id) ON DELETE RESTRICT;
