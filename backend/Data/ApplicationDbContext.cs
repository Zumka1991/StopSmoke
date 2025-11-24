using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public DbSet<Relapse> Relapses { get; set; }
    public DbSet<Marathon> Marathons { get; set; }
    public DbSet<MarathonParticipant> MarathonParticipants { get; set; }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
}
