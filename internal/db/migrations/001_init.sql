create table if not exist users(
id int AUTO_INCREMENT PRIMARY KEY, 
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  created_at TIMESTAMP default CURRENT_TIMESTAMP
);

create table if not exists sessions(
  id int AUTO_INCREMENT PRIMARY KEY,
  user_id varchar(100) not null,
  mode varchar (20) not null,
  created_at timestamp default CURRENT_TIMESTAMP
  FOREIGN KEY (user_id) REFERENCES users(id)
)