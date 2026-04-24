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

    public virtual DbSet<AspNetUsers> AspNetUsers { get; set; }

    public virtual DbSet<Controller> Controller { get; set; }

    public virtual DbSet<Domain> Domain { get; set; }

    public virtual DbSet<ElectronicEvents> ElectronicEvents { get; set; }

    public virtual DbSet<HMdatasetArticles> HMdatasetArticles { get; set; }

    public virtual DbSet<HMdatasetCustomers> HMdatasetCustomers { get; set; }

    public virtual DbSet<HMdatasetTransactionsTrain> HMdatasetTransactionsTrain { get; set; }

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

        modelBuilder.Entity<AspNetUsers>(entity =>
        {
            entity.Property(e => e.Id).HasMaxLength(256);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Firstname).IsRequired();
            entity.Property(e => e.Lastname).IsRequired();
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.PersonalNumber).IsRequired();
            entity.Property(e => e.UserName).HasMaxLength(256);

            entity.HasOne(d => d.Domain).WithMany(p => p.AspNetUsers)
                .HasForeignKey(d => d.DomainId)
                .HasConstraintName("FK_AspNetUsers_Domain");
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

        modelBuilder.Entity<ElectronicEvents>(entity =>
        {
            entity.Property(e => e.EventTime).IsRequired();
            entity.Property(e => e.EventType).IsRequired();
            entity.Property(e => e.Price).IsRequired();
        });

        modelBuilder.Entity<HMdatasetArticles>(entity =>
        {
            entity.ToTable("H&MDataset_Articles");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ColourGroupName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.DepartmentName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.GarmentGroupName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.GraphicalAppearanceName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.IndexCode)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.IndexGroupName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.IndexName).IsRequired();
            entity.Property(e => e.PerceivedColourMasterName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.PerceivedColourValueName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.ProdName).IsRequired();
            entity.Property(e => e.ProductGroupName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.ProductTypeName)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.SectionName)
                .IsRequired()
                .HasMaxLength(50);
        });

        modelBuilder.Entity<HMdatasetCustomers>(entity =>
        {
            entity.ToTable("H&MDataset_Customers");

            entity.Property(e => e.Id).HasMaxLength(100);
            entity.Property(e => e.Active).HasMaxLength(10);
            entity.Property(e => e.Age).HasMaxLength(10);
            entity.Property(e => e.ClubMemberStatus).HasMaxLength(50);
            entity.Property(e => e.FashionNewsFrequency).HasMaxLength(50);
            entity.Property(e => e.Fn)
                .HasMaxLength(10)
                .HasColumnName("FN");
            entity.Property(e => e.PostalCode)
                .IsRequired()
                .HasMaxLength(100);
        });

        modelBuilder.Entity<HMdatasetTransactionsTrain>(entity =>
        {
            entity.ToTable("H&MDataset_TransactionsTrain");

            entity.Property(e => e.CustomerId)
                .IsRequired()
                .HasMaxLength(100);
        });

        modelBuilder.Entity<Log>(entity =>
        {
            entity.ToTable("Log", "core");

            entity.Property(e => e.Action).HasMaxLength(128);
            entity.Property(e => e.Controller).HasMaxLength(128);
            entity.Property(e => e.HttpMethod).HasMaxLength(64);
            entity.Property(e => e.InsertedDate).HasColumnType("datetime");
            entity.Property(e => e.Ip).HasMaxLength(64);
            entity.Property(e => e.UserId).HasMaxLength(256);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
