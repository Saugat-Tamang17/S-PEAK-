-- Active: 1780405368569@@127.0.0.1@3306@s_peak
create table if not exists users(
  id int AUTO_INCREMENT PRIMARY KEY, 
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  created_at TIMESTAMP default CURRENT_TIMESTAMP
);

create table if not exists sessions(
  id int AUTO_INCREMENT PRIMARY KEY,
  user_id int not null,
  mode varchar (20) not null,
  created_at timestamp default CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)