-- Structure de la base CHOMA TECH (tables, index, contraintes), SANS aucune donnée.
-- Générée avec pg_dump --schema-only depuis la base de développement (PostgreSQL 18).
-- Exécutée automatiquement par le conteneur "db" au PREMIER démarrage (volume vide).

-- PostgreSQL database dump
--


-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Abonne_Newsletter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Abonne_Newsletter" (
    id uuid NOT NULL,
    email public.citext NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Annonce; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Annonce" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(250) NOT NULL,
    categorie character varying(250) NOT NULL,
    statut character varying(250) NOT NULL,
    epingle boolean DEFAULT false NOT NULL,
    vues integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Avis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Avis" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    note integer NOT NULL,
    commentaire text NOT NULL,
    statut character varying(250) DEFAULT 'En attente'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "Avis_note_check" CHECK (((note >= 1) AND (note <= 5)))
);


--
-- Name: Client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Client" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(250) NOT NULL,
    prenom character varying(250) NOT NULL,
    email public.citext NOT NULL,
    password character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role character varying(250) DEFAULT 'Client'::character varying NOT NULL,
    CONSTRAINT ck_client_role CHECK (((role)::text = ANY ((ARRAY['Client'::character varying, 'Admin'::character varying])::text[])))
);


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversation" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Demande_Produit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Demande_Produit" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    produit_id uuid NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    montant_unitaire numeric(10,2) NOT NULL,
    statut character varying(250) DEFAULT 'Préparation'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    est_paye boolean DEFAULT false NOT NULL
);


--
-- Name: Demande_Service; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Demande_Service" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    service_id uuid NOT NULL,
    montant_convenu numeric(10,2),
    statut character varying(250) DEFAULT 'Validation'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    est_paye boolean DEFAULT false NOT NULL
);


--
-- Name: Faq; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Faq" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question character varying(270) NOT NULL,
    reponse text NOT NULL,
    categorie character varying(250) NOT NULL,
    statut character varying(250) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Knowledgebase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Knowledgebase" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(270) NOT NULL,
    contenu text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender character varying(20) NOT NULL,
    message text NOT NULL,
    lu boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "Message_sender_check" CHECK (((sender)::text = ANY ((ARRAY['client'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: Message_Contact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message_Contact" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom_complet character varying(150) NOT NULL,
    email public.citext NOT NULL,
    telephone character varying(50),
    entreprise character varying(150),
    service_souhaite character varying(250),
    budget character varying(250),
    message text NOT NULL,
    lu boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(250) NOT NULL,
    type character varying(250) NOT NULL,
    message character varying(300) NOT NULL,
    lu boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id uuid NOT NULL
);


--
-- Name: Parametres_Site; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Parametres_Site" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom_entreprise character varying(150) NOT NULL,
    slogan character varying(250) NOT NULL,
    email character varying(250) NOT NULL,
    telephone character varying(50) NOT NULL,
    adresse character varying(250) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Produit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Produit" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom_produit character varying(250) NOT NULL,
    categorie character varying(250) NOT NULL,
    montant numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    image text,
    statut character varying(250) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text
);


--
-- Name: Realisation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Realisation" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(250) NOT NULL,
    categorie character varying(250) NOT NULL,
    technologies character varying(500) NOT NULL,
    image character varying(500),
    description text,
    lien character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Service; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Service" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom_service character varying(250) NOT NULL,
    categorie character varying(250) NOT NULL,
    description text,
    montant numeric(10,2),
    statut character varying(250) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Abonne_Newsletter Abonne_Newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Abonne_Newsletter"
    ADD CONSTRAINT "Abonne_Newsletter_pkey" PRIMARY KEY (id);


--
-- Name: Annonce Annonce_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Annonce"
    ADD CONSTRAINT "Annonce_pkey" PRIMARY KEY (id);


--
-- Name: Avis Avis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Avis"
    ADD CONSTRAINT "Avis_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_email_key" UNIQUE (email);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Demande_Produit Demande_Produit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demande_Produit"
    ADD CONSTRAINT "Demande_Produit_pkey" PRIMARY KEY (id);


--
-- Name: Demande_Service Demande_Service_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demande_Service"
    ADD CONSTRAINT "Demande_Service_pkey" PRIMARY KEY (id);


--
-- Name: Faq Faq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Faq"
    ADD CONSTRAINT "Faq_pkey" PRIMARY KEY (id);


--
-- Name: Knowledgebase Knowledgebase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Knowledgebase"
    ADD CONSTRAINT "Knowledgebase_pkey" PRIMARY KEY (id);


--
-- Name: Message_Contact Message_Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message_Contact"
    ADD CONSTRAINT "Message_Contact_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Parametres_Site Parametres_Site_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Parametres_Site"
    ADD CONSTRAINT "Parametres_Site_pkey" PRIMARY KEY (id);


--
-- Name: Produit Produit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Produit"
    ADD CONSTRAINT "Produit_pkey" PRIMARY KEY (id);


--
-- Name: Realisation Realisation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Realisation"
    ADD CONSTRAINT "Realisation_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: IX_Abonne_Newsletter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_Abonne_Newsletter_email" ON public."Abonne_Newsletter" USING btree (email);


--
-- Name: idx_avis_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avis_client ON public."Avis" USING btree (client_id);


--
-- Name: idx_conversation_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_client ON public."Conversation" USING btree (client_id);


--
-- Name: idx_demande_produit_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demande_produit_client ON public."Demande_Produit" USING btree (client_id);


--
-- Name: idx_demande_produit_produit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demande_produit_produit ON public."Demande_Produit" USING btree (produit_id);


--
-- Name: idx_demande_service_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demande_service_client ON public."Demande_Service" USING btree (client_id);


--
-- Name: idx_demande_service_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demande_service_service ON public."Demande_Service" USING btree (service_id);


--
-- Name: idx_message_contact_lu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_contact_lu ON public."Message_Contact" USING btree (lu);


--
-- Name: idx_message_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_conversation ON public."Message" USING btree (conversation_id);


--
-- Name: Avis Avis_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Avis"
    ADD CONSTRAINT "Avis_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public."Client"(id) ON DELETE CASCADE;


--
-- Name: Conversation fk_conversation_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT fk_conversation_client FOREIGN KEY (client_id) REFERENCES public."Client"(id) ON DELETE CASCADE;


--
-- Name: Demande_Produit fk_demande_produit_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demande_Produit"
    ADD CONSTRAINT fk_demande_produit_client FOREIGN KEY (client_id) REFERENCES public."Client"(id) ON DELETE RESTRICT;


--
-- Name: Demande_Produit fk_demande_produit_produit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demande_Produit"
    ADD CONSTRAINT fk_demande_produit_produit FOREIGN KEY (produit_id) REFERENCES public."Produit"(id) ON DELETE RESTRICT;


--
-- Name: Demande_Service fk_demande_service_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demande_Service"
    ADD CONSTRAINT fk_demande_service_client FOREIGN KEY (client_id) REFERENCES public."Client"(id) ON DELETE RESTRICT;


--
-- Name: Demande_Service fk_demande_service_service; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demande_Service"
    ADD CONSTRAINT fk_demande_service_service FOREIGN KEY (service_id) REFERENCES public."Service"(id) ON DELETE RESTRICT;


--
-- Name: Message fk_message_conversation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES public."Conversation"(id) ON DELETE CASCADE;


--
-- Name: Notification fk_notification_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT fk_notification_client FOREIGN KEY (client_id) REFERENCES public."Client"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


