create table if not exist users(
id int AUTO_INCREMENT PRIMARY KEY, 
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  created_at TIMESTAMP default CURRENT_TIMESTAMP
);

