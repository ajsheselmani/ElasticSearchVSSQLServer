using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Action> Action { get; set; }

    public virtual DbSet<AmazonReviews> AmazonReviews { get; set; }

    public virtual DbSet<AspNetUsers> AspNetUsers { get; set; }

    public virtual DbSet<Bankdataset> Bankdataset { get; set; }

    public virtual DbSet<Controller> Controller { get; set; }

    public virtual DbSet<Domain> Domain { get; set; }

    public virtual DbSet<Log> Log { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Action>(entity =>
        {
            entity.ToTable("Action", "core");

            entity.Property(e => e.ActionId).ValueGeneratedNever();
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Type).HasMaxLength(255);

            entity.HasOne(d => d.Controller).WithMany(p => p.Action)
                .HasForeignKey(d => d.ControllerId)
                .HasConstraintName("FK_Action_Action");
        });

        modelBuilder.Entity<AmazonReviews>(entity =>
        {
            entity.HasNoKey();

            entity.Property(e => e.Brand).HasMaxLength(255);
            entity.Property(e => e.Category).HasMaxLength(255);
            entity.Property(e => e.ItemName).HasMaxLength(1000);
            entity.Property(e => e.Price).HasMaxLength(50);
            entity.Property(e => e.Rating).HasColumnType("decimal(3, 1)");
            entity.Property(e => e.Summary).HasMaxLength(1000);
            entity.Property(e => e.UserName).HasMaxLength(255);
            entity.Property(e => e.Verified).HasMaxLength(10);
        });

        modelBuilder.Entity<AspNetUsers>(entity =>
        {
            entity.Property(e => e.Id).HasMaxLength(255);
            entity.Property(e => e.ActivationDate).HasMaxLength(255);
            entity.Property(e => e.Birthdate).HasMaxLength(255);
            entity.Property(e => e.ConcurrencyStamp).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.ExpirationDate).HasMaxLength(255);
            entity.Property(e => e.Firstname).HasMaxLength(255);
            entity.Property(e => e.ImageProfile).HasMaxLength(255);
            entity.Property(e => e.Lastname).HasMaxLength(255);
            entity.Property(e => e.LockoutEnd).HasMaxLength(255);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(255);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(255);
            entity.Property(e => e.PasswordExpires).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.PersonalNumber).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(255);
            entity.Property(e => e.SecurityStamp).HasMaxLength(255);
            entity.Property(e => e.UserName).HasMaxLength(255);

            entity.HasOne(d => d.Domain).WithMany(p => p.AspNetUsers)
                .HasForeignKey(d => d.DomainId)
                .HasConstraintName("FK_AspNetUsers_Domain");
        });

        modelBuilder.Entity<Bankdataset>(entity =>
        {
            entity
                .HasNoKey()
                .ToTable("bankdataset$");

            entity.Property(e => e.Date).HasColumnType("datetime");
            entity.Property(e => e.Domain).HasMaxLength(255);
            entity.Property(e => e.Location).HasMaxLength(255);
            entity.Property(e => e.TransactionCount).HasColumnName("Transaction_count");
        });

        modelBuilder.Entity<Controller>(entity =>
        {
            entity.ToTable("Controller", "core");

            entity.Property(e => e.ControllerId)
                .ValueGeneratedNever()
                .HasColumnName("ControllerID");
            entity.Property(e => e.Name).HasMaxLength(255);
        });

        modelBuilder.Entity<Domain>(entity =>
        {
            entity.ToTable("Domain", "core");

            entity.Property(e => e.DomainId)
                .ValueGeneratedNever()
                .HasColumnName("DomainID");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsFixedLength();
        });

        modelBuilder.Entity<Log>(entity =>
        {
            entity.ToTable("Log", "core");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Action).HasMaxLength(128);
            entity.Property(e => e.Controller).HasMaxLength(128);
            entity.Property(e => e.Exception).HasMaxLength(255);
            entity.Property(e => e.FormContent).HasMaxLength(255);
            entity.Property(e => e.HttpMethod).HasMaxLength(64);
            entity.Property(e => e.InsertedDate).HasColumnType("datetime");
            entity.Property(e => e.Ip).HasMaxLength(64);
            entity.Property(e => e.Response).HasMaxLength(255);
            entity.Property(e => e.Url).HasMaxLength(255);
            entity.Property(e => e.UserId).HasMaxLength(255);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
