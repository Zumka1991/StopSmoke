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
    }
}
