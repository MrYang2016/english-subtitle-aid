CREATE TABLE `Videos` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `thumbnailUrl` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Subtitles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `videoId` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `language` varchar(255) NOT NULL,
  `startTime` int NOT NULL,
  `duration` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `videoId` (`videoId`),
  CONSTRAINT `subtitles_ibfk_2` FOREIGN KEY (`videoId`) REFERENCES `Videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 建一张表用来存在翻译结果的json字符串
CREATE TABLE `Translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `originalText` text NOT NULL,
  `translation` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
