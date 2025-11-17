CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  room_type VARCHAR(60) NOT NULL,
  nightly_rate DECIMAL(10, 2) NOT NULL,
  status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

