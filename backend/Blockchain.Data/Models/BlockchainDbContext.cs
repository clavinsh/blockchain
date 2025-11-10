using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace Blockchain.Data.Models;

public partial class BlockchainDbContext : DbContext
{
    public BlockchainDbContext()
    {
    }

    public BlockchainDbContext(DbContextOptions<BlockchainDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<CarDataCache> CarDataCaches { get; set; }

    public virtual DbSet<CarTable> CarTables { get; set; }

    public virtual DbSet<UserTable> UserTables { get; set; }

    public virtual DbSet<Users2Car> Users2Cars { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=localhost;port=3306;database=blockchaindb;user=admin;password=admin", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.44-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<CarDataCache>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("CarDataCache");

            entity.HasIndex(e => e.CarId, "CarId");

            entity.Property(e => e.CarData).HasColumnType("text");
            entity.Property(e => e.DeleteTime).HasColumnType("timestamp");
            entity.Property(e => e.InsertTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");

            entity.HasOne(d => d.Car).WithMany(p => p.CarDataCaches)
                .HasForeignKey(d => d.CarId)
                .HasConstraintName("CarDataCache_ibfk_1");
        });

        modelBuilder.Entity<CarTable>(entity =>
        {
            entity.HasKey(e => e.CarId).HasName("PRIMARY");

            entity.ToTable("CarTable");

            entity.HasIndex(e => e.LicensePlate, "LicensePlate").IsUnique();

            entity.HasIndex(e => e.Vin, "VIN").IsUnique();

            entity.Property(e => e.Brand).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(30);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");
            entity.Property(e => e.LicensePlate).HasMaxLength(20);
            entity.Property(e => e.Mileage).HasDefaultValueSql("'0'");
            entity.Property(e => e.Model).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");
            entity.Property(e => e.Vin)
                .HasMaxLength(17)
                .HasColumnName("VIN");
        });

        modelBuilder.Entity<UserTable>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity.ToTable("UserTable");

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.HasIndex(e => e.Username, "Username").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FirstName).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValueSql("'1'");
            entity.Property(e => e.LastName).HasMaxLength(50);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");
            entity.Property(e => e.Username).HasMaxLength(100);
        });

        modelBuilder.Entity<Users2Car>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.CarId, "CarId");

            entity.HasIndex(e => new { e.UserId, e.CarId }, "unique_user_car").IsUnique();

            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");

            entity.HasOne(d => d.Car).WithMany(p => p.Users2Cars)
                .HasForeignKey(d => d.CarId)
                .HasConstraintName("Users2Cars_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.Users2Cars)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Users2Cars_ibfk_1");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
