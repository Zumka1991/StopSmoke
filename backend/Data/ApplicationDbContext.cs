using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public DbSet<Relapse> Relapses { get; set; }
    public DbSet<Marathon> Marathons { get; set; }
    public DbSet<MarathonParticipant> MarathonParticipants { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Article> Articles { get; set; }
    public DbSet<Comment> Comments { get; set; }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Conversation relationships
        modelBuilder.Entity<Conversation>()
            .HasMany(c => c.Participants)
            .WithOne(p => p.Conversation)
            .HasForeignKey(p => p.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Conversation>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure ConversationParticipant relationships
        modelBuilder.Entity<ConversationParticipant>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Message relationships
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Create index for faster queries
        modelBuilder.Entity<ConversationParticipant>()
            .HasIndex(p => new { p.ConversationId, p.UserId })
            .IsUnique();

        modelBuilder.Entity<Message>()
            .HasIndex(m => m.ConversationId);

        // Configure Article relationships
        modelBuilder.Entity<Article>()
            .HasOne(a => a.Author)
            .WithMany()
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Article>()
            .HasIndex(a => a.IsPublished);

        // Configure Comment relationships
        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Article)
            .WithMany()
            .HasForeignKey(c => c.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasIndex(c => c.ArticleId);

        modelBuilder.Entity<Comment>()
            .HasIndex(c => c.CreatedAt);
    }
}
