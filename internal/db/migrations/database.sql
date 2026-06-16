-- Active: 1780405368569@@127.0.0.1@3306@s_peak

drop table if exists transcripts;
drop table if exists sessions;
drop table if exists users;
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
);


create table if not exists transcripts(
  id int AUTO_INCREMENT PRIMARY KEY,
  session_id int not null,
  raw_text text not null,
  enhanced_text text not null,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  Foreign Key (session_id) REFERENCES sessions(id)
);

DESCRIBE users;
describe sessions;
describe transcripts;


create table if not exists evaluations(
  id int AUTO_INCREMENT PRIMARY KEY,
  transcript_id int not null,
  topic varchar(500) not null,
  content_score int not null,
  fluency_score int not null,
  grammar_score int not null,
  overall_score int not null,
  corrected_answer text not null,
  feedback text not null,
  created_at timestamp default CURRENT_TIMESTAMP,
  FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
);

DESCRIBE evaluations;

show TABLES;

SELECT DATABASE();

show tables;

select *from users;
INSERT IGNORE INTO users (id, email, password_hash) VALUES (1, 'test@speal.dev', 'placeholder');
select *from users;