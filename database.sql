CREATE TABLE users (
    id INT NOT NULL PRIMARY KEY IDENTITY,
    discord_id BIGINT NOT NULL,
    discord_name varchar(25) NOT NULL,
    messages int DEFAULT 0,
    osu_username VARCHAR(25) NULL
);