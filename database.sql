CREATE TABLE users (
    id INT NOT NULL PRIMARY KEY IDENTITY,
    discord_id BIGINT NOT NULL UNIQUE,
    discord_name varchar(25) NOT NULL,
    messages int DEFAULT 0,
    osu_username VARCHAR(25) NULL
);
CREATE TABLE servers (
    id_ser INT NOT NULL PRIMARY KEY IDENTITY,
    discord_id BIGINT NOT NULL UNIQUE,
    discord_name VARCHAR(35) NOT NULL,
    messages INT DEFAULT 1
);
CREATE TABLE tracked_users (
    id_tu INT NOT NULL PRIMARY KEY IDENTITY,
    osu_id INT NOT NULL UNIQUE,
    osu_name INT NOT NULL UNIQUE
);
CREATE TABLE tracking (
    id_trc INT NOT NULL PRIMARY KEY IDENTITY,
    id_ser INT NOT NULL,
    id_tu INT NOT NULL,
    channel_id BIGINT NOT NULL,
    gamemode TINYINT DEFAULT 0,
    CONSTRAINT FK_id_ser FOREIGN KEY (id_ser) REFERENCES servers(id_ser),
    CONSTRAINT FK_id_tu FOREIGN KEY (id_tu) REFERENCES tracked_users(id_tu)
);
