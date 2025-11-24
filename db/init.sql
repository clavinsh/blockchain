GRANT ALL PRIVILEGES ON blockchaindb.* TO 'admin'@'%';
FLUSH PRIVILEGES;
USE blockchaindb;

CREATE TABLE IF NOT EXISTS Roles (
    RoleCode VARCHAR(20) PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Description TEXT
);

CREATE TABLE IF NOT EXISTS UserTable (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS CarTable (
    CarId INT AUTO_INCREMENT PRIMARY KEY,
    Brand VARCHAR(50) NOT NULL,
    Model VARCHAR(50) NOT NULL,
    Year INT NOT NULL,
    LicensePlate VARCHAR(20) UNIQUE,
    VIN VARCHAR(17) UNIQUE,
    Color VARCHAR(30),
    Mileage INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Users2Cars (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    CarId INT NOT NULL,
    RoleCode VARCHAR(20) NOT NULL,
    AssignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES UserTable(UserId) ON DELETE CASCADE,
    FOREIGN KEY (CarId) REFERENCES CarTable(CarId) ON DELETE CASCADE,
    FOREIGN KEY (RoleCode) REFERENCES Roles(RoleCode) ON DELETE RESTRICT,
    UNIQUE KEY unique_user_car (UserId, CarId)
);

CREATE TABLE IF NOT EXISTS CarInvites (
    InviteId INT AUTO_INCREMENT PRIMARY KEY,
    CarId INT NOT NULL,
    InviterUserId INT NOT NULL,
    InvitedUserId INT NOT NULL,
    RoleCode VARCHAR(20) NOT NULL,
    InviteStatus ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') DEFAULT 'PENDING',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CarId) REFERENCES CarTable(CarId) ON DELETE CASCADE,
    FOREIGN KEY (InviterUserId) REFERENCES UserTable(UserId) ON DELETE CASCADE,
    FOREIGN KEY (InvitedUserId) REFERENCES UserTable(UserId) ON DELETE CASCADE,
    FOREIGN KEY (RoleCode) REFERENCES Roles(RoleCode) ON DELETE RESTRICT,
    UNIQUE KEY unique_pending_invite (CarId, InvitedUserId, InviteStatus)
);

CREATE TABLE IF NOT EXISTS CarDataCache (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CarId INT NOT NULL,
    CarData TEXT NOT NULL, 
    InsertTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DeleteTime TIMESTAMP NULL,
    FOREIGN KEY (CarId) REFERENCES CarTable(CarId) ON DELETE CASCADE
);

INSERT INTO Roles (RoleCode, Name, Description) VALUES
('OWNER', 'Owner', 'Primary owner of the vehicle with full access'),
('DRIVER', 'Driver', 'Authorized driver with standard access'),
('VIEWER', 'Viewer', 'Can only view vehicle data and statistics');

-- (password for both: Password123)
INSERT INTO UserTable (Username, Email, PasswordHash, FirstName, LastName) VALUES
('john_doe', 'john.doe@example.com', '$2b$12$z5rzfyowqjzVlwQ2FcP1XeVr/c0ObNtbx8gwAnmB0u6/FrIwk8APm', 'John', 'Doe'),
('jane_smith', 'jane.smith@example.com', '$2b$12$odq0FbVBjHkgO1nSq7ent.PG.nR5D.aV6WkX6oEohbta.iNIWSwJa', 'Jane', 'Smith');

INSERT INTO CarTable (Brand, Model, Year, LicensePlate, VIN, Color, Mileage) VALUES
('Toyota', 'Camry', 2022, 'ABC123', '1HGBH41JXMN109186', 'Silver', 15000),
('Honda', 'Civic', 2021, 'XYZ789', '2HGFG12648H543210', 'Blue', 22000),
('Tesla', 'Model 3', 2023, 'EV001', '5YJ3E1EA5JF000001', 'White', 8000);

INSERT INTO Users2Cars (UserId, CarId, RoleCode) VALUES
(1, 1, 'OWNER'),
(2, 2, 'OWNER'),
(2, 3, 'OWNER');