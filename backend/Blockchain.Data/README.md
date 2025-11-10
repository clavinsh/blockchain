# DB scaffolding 

Please check that the MySQL database is up and running locally.

If not already installed, add Entity Framework CLI tooling:
```bash
dotnet tool install --global dotnet-ef
```

Scaffold the database:
```bash
dotnet ef dbcontext scaffold "Server=localhost;Port=3306;Database=blockchaindb;User=admin;Password=admin;" Pomelo.EntityFrameworkCore.MySql -o Models -c BlockchainDbContext -f
```
