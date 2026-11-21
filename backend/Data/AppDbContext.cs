using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Clients => Set<User>();
        public DbSet<Produit> Produits => Set<Produit>();
        public DbSet<Service> Services => Set<Service>();
        public DbSet<DemandeProduit> DemandesProduits => Set<DemandeProduit>();
        public DbSet<DemandeService> DemandesServices => Set<DemandeService>();
        public DbSet<Paiement> Paiements => Set<Paiement>();
        public DbSet<Annonce> Annonces => Set<Annonce>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<Faq> Faqs => Set<Faq>();
        public DbSet<Knowledgebase> Knowledgebases => Set<Knowledgebase>();
        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<Avis> Avis => Set<Avis>();
        public DbSet<Parametre> Parametres => Set<Parametre>();
        public DbSet<Realisation> Realisations => Set<Realisation>();
        public DbSet<MessageContact> MessagesContact => Set<MessageContact>();
        public DbSet<AbonneNewsletter> AbonnesNewsletter => Set<AbonneNewsletter>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasPostgresExtension("uuid-ossp");
            modelBuilder.HasPostgresExtension("pgcrypto");
            modelBuilder.HasPostgresExtension("citext");

            modelBuilder.Entity<User>()
                .HasIndex(c => c.Email)
                .IsUnique();

            modelBuilder.Entity<AbonneNewsletter>()
                .HasIndex(a => a.Email)
                .IsUnique();

            // Demande_Produit / Demande_Service : on empêche la suppression d'un client, d'un produit
            // ou d'un service tant qu'il existe des demandes liées, pour ne jamais perdre l'historique
            // de commande silencieusement (voir schema.sql).
            modelBuilder.Entity<DemandeProduit>()
                .HasOne(d => d.Client)
                .WithMany(c => c.DemandesProduits)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DemandeProduit>()
                .HasOne(d => d.Produit)
                .WithMany(p => p.Demandes)
                .HasForeignKey(d => d.ProduitId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DemandeService>()
                .HasOne(d => d.Client)
                .WithMany(c => c.DemandesServices)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DemandeService>()
                .HasOne(d => d.Service)
                .WithMany(s => s.Demandes)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Paiement>()
                .HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Paiement>()
                .HasIndex(p => new { p.ClientId, p.RequestKey })
                .IsUnique();

            modelBuilder.Entity<Paiement>()
                .HasIndex(p => p.SasPayCheckoutId)
                .IsUnique();

            modelBuilder.Entity<DemandeProduit>()
                .HasOne(d => d.Paiement)
                .WithMany(p => p.DemandesProduits)
                .HasForeignKey(d => d.PaiementId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DemandeService>()
                .HasOne(d => d.Paiement)
                .WithMany(p => p.DemandesServices)
                .HasForeignKey(d => d.PaiementId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification : suppression en cascade, pas d'historique "comptable" à préserver.
            // Pas de collection inverse sur User (une diffusion à tous les clients peut créer
            // des centaines de lignes, pas besoin de les charger via la navigation User -> Notifications).
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Client)
                .WithMany()
                .HasForeignKey(n => n.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Conversation / Message : suppression en cascade, pas d'historique "comptable" à préserver.
            modelBuilder.Entity<Conversation>()
                .HasOne(c => c.Client)
                .WithMany(c => c.Conversations)
                .HasForeignKey(c => c.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .ToTable(t => t.HasCheckConstraint("ck_message_sender", "sender IN ('client', 'admin')"));

            // Avis : suppression en cascade (un avis n'a pas de valeur "comptable" à préserver),
            // et contrainte de plage sur la note pour ne jamais accepter autre chose que 1 à 5.
            modelBuilder.Entity<Avis>()
                .HasOne(a => a.Client)
                .WithMany()
                .HasForeignKey(a => a.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Avis>()
                .ToTable(t => t.HasCheckConstraint("ck_avis_note", "note BETWEEN 1 AND 5"));
        }
    }
}
