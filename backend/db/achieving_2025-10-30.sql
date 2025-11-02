-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: achieving_db
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `borrow_entries`
--

DROP TABLE IF EXISTS `borrow_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow_entries` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `from` longtext COLLATE utf8mb4_general_ci,
  `amount` double DEFAULT NULL,
  `date` datetime(3) DEFAULT NULL,
  `repaid_amount` double DEFAULT NULL,
  `repaid_date` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `month_key` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_borrow_entries_month_key` (`month_key`),
  KEY `idx_borrow_entries_user_id` (`user_id`),
  CONSTRAINT `fk_borrow_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow_entries`
--

LOCK TABLES `borrow_entries` WRITE;
/*!40000 ALTER TABLE `borrow_entries` DISABLE KEYS */;
INSERT INTO `borrow_entries` VALUES ('36f5d6e1-b4d7-4c88-bbb0-e0856003e4b1','Ta',20,'2025-11-10 07:00:00.000',NULL,NULL,'2025-10-25 16:21:55.756','2025-11',NULL);
/*!40000 ALTER TABLE `borrow_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `name` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('ចាក់សាំ','','2025-10-25 13:52:02.702'),('ទិញនំ','','2025-10-25 12:09:29.029'),('ទិញសំម្ភារះ','','2025-10-25 13:21:38.571'),('ទិញឡេ','','2025-10-25 12:09:17.684'),('បោកខោរអាវ','','2025-10-25 13:55:42.380'),('Buy food','b4141e53-0049-4ff6-af94-3b9906595f68','2025-10-26 17:31:22.128'),('Shopping','b4141e53-0049-4ff6-af94-3b9906595f68','2025-10-26 17:07:47.067');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `earning_entries`
--

DROP TABLE IF EXISTS `earning_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `earning_entries` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `source` longtext COLLATE utf8mb4_general_ci,
  `amount` double DEFAULT NULL,
  `date` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `month_key` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_earning_entries_month_key` (`month_key`),
  KEY `idx_earning_entries_user_id` (`user_id`),
  CONSTRAINT `fk_earning_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `earning_entries`
--

LOCK TABLES `earning_entries` WRITE;
/*!40000 ALTER TABLE `earning_entries` DISABLE KEYS */;
INSERT INTO `earning_entries` VALUES ('78bab5ca-1afd-46dd-8869-d3ac84ff558e','dasfsadf',10,'2025-10-25 07:00:00.000','2025-10-25 13:20:11.179','2025-10',NULL),('9001e77d-0f88-45bc-983f-526a835e6596','Investing',500,'2025-12-17 07:00:00.000','2025-10-26 17:36:00.263','2025-12','b459f7bb-fbe3-4d44-a8f3-21580df0b0b3'),('e91366a2-1f72-4ba8-90ca-ada6ef432d2b','salary',500,'2025-11-13 07:00:00.000','2025-10-25 16:21:18.827','2025-11',NULL);
/*!40000 ALTER TABLE `earning_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goals`
--

DROP TABLE IF EXISTS `goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goals` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `title` longtext COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `category` longtext COLLATE utf8mb4_general_ci,
  `save_frequency` longtext COLLATE utf8mb4_general_ci,
  `duration` bigint DEFAULT NULL,
  `start_date` datetime(3) DEFAULT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  `target_date` datetime(3) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'not_started',
  `created_at` datetime(3) DEFAULT NULL,
  `target_amount` double DEFAULT NULL,
  `current_amount` double DEFAULT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_goals_user_id` (`user_id`),
  CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goals`
--

LOCK TABLES `goals` WRITE;
/*!40000 ALTER TABLE `goals` DISABLE KEYS */;
INSERT INTO `goals` VALUES ('896cd2b4-d30a-427f-91eb-76355e65ae76','Buy phone','sdfghj','Transportation','monthly',1,'2025-10-26 07:00:00.000','2025-11-26 07:00:00.000','2025-11-26 07:00:00.000','active','2025-10-26 17:36:31.703',499.97,249.99,'b459f7bb-fbe3-4d44-a8f3-21580df0b0b3'),('a5d2ade9-5c0a-4544-a193-4d7dfd7bf6b8','sdf','sdf','Transportation','monthly',1,'2025-10-26 07:00:00.000','2025-11-26 07:00:00.000','2025-11-26 07:00:00.000','active','2025-10-26 17:27:07.972',10,5,'b4141e53-0049-4ff6-af94-3b9906595f68'),('e86d8506-dde7-4f1a-95c2-f52dde32e39e','Buy Car','GTV reahu','Housing','monthly',12,'2025-10-26 07:00:00.000','2026-10-26 07:00:00.000','2026-10-26 07:00:00.000','active','2025-10-26 17:32:15.248',17000,NULL,'b4141e53-0049-4ff6-af94-3b9906595f68');
/*!40000 ALTER TABLE `goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `months`
--

DROP TABLE IF EXISTS `months`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `months` (
  `month_key` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`month_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `months`
--

LOCK TABLES `months` WRITE;
/*!40000 ALTER TABLE `months` DISABLE KEYS */;
INSERT INTO `months` VALUES ('2025-07','','2025-10-25 13:35:02.261'),('2025-08','','2025-10-25 13:18:43.557'),('2025-09','','2025-10-25 13:30:08.249'),('2025-10','','2025-10-25 12:45:39.587'),('2025-11','','2025-10-25 12:04:23.074'),('2025-12','','2025-10-25 17:13:30.560'),('2025-07','b4141e53-0049-4ff6-af94-3b9906595f68','2025-10-26 17:37:37.265'),('2025-10','b4141e53-0049-4ff6-af94-3b9906595f68','2025-10-26 17:29:21.417'),('2025-11','b4141e53-0049-4ff6-af94-3b9906595f68','2025-10-26 17:30:03.222'),('2025-12','b459f7bb-fbe3-4d44-a8f3-21580df0b0b3','2025-10-26 17:33:58.496'),('2025-04','eca0be1b-c6d0-481d-9732-b0c326ddb4fb','2025-10-26 16:56:26.000'),('2025-05','eca0be1b-c6d0-481d-9732-b0c326ddb4fb','2025-10-26 16:57:35.768');
/*!40000 ALTER TABLE `months` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `month_key` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `planned_amount` double DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_month_category` (`user_id`,`month_key`,`category`),
  KEY `idx_month_category` (`month_key`,`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES ('0a079467-8019-4b58-a318-6ed3e215af97','','2025-10','ចាក់សាំ',20,'2025-10-25 13:52:34.777'),('1251b32f-7639-4994-9d72-54d19b62c952','','2025-12','ទិញឡេ',0,'2025-10-25 17:13:30.570'),('1317bc63-de76-41fe-9f88-c7b8cb77e6cf','b4141e53-0049-4ff6-af94-3b9906595f68','2025-07','Buy food',0,'2025-10-26 17:37:37.266'),('15758ee0-5228-4f38-b0c9-8067705d13ac','','2025-10','បោកខោរអាវ',20,'2025-10-25 13:55:57.222'),('233cc9df-145d-4ace-a412-feebd1cff83f','','2025-08','ទិញនំ',0,'2025-10-25 13:18:43.559'),('3c03df00-df32-489b-87f6-f6ac121bf4df','b459f7bb-fbe3-4d44-a8f3-21580df0b0b3','2025-12','Food',500,'2025-10-26 17:34:49.632'),('42156fb9-d6c5-4453-98f8-c57c545420bb','','2025-07','ទិញឡេ',0,'2025-10-25 13:35:02.266'),('42ca2414-3d4f-4b0c-9bde-da7835e85e5d','','2025-08','ទិញឡេ',0,'2025-10-25 13:18:43.560'),('5c5ffab1-c0ea-4d84-9bfa-28186623db1b','','2025-09','ទិញនំ',0,'2025-10-25 13:30:08.251'),('5fbfec95-75da-4e18-8512-cbc89a0320fe','','2025-12','ចាក់សាំ',0,'2025-10-25 17:13:30.567'),('6351f7a0-8bd9-4f41-949e-10de50a7b419','','2025-09','ទិញសំម្ភារះ',0,'2025-10-25 13:30:08.253'),('69825bff-d8de-4977-887e-ce54931bfc66','','2025-12','ទិញនំ',0,'2025-10-25 17:13:30.569'),('6bcc8f39-e82c-46ec-b48e-174b104d2b09','b4141e53-0049-4ff6-af94-3b9906595f68','2025-11','Shopping',50,'2025-10-26 17:30:03.225'),('78788e90-aeff-4463-8bd8-6a4bf4dfbba6','','2025-12','ទិញសំម្ភារះ',0,'2025-10-25 17:13:30.570'),('861fb208-1539-4c74-a05a-0da48843ff7b','','2025-07','ទិញនំ',0,'2025-10-25 13:35:02.264'),('9cca934f-107a-4b72-a709-b43034917dc6','','2025-11','ចាក់សាំ',50,'2025-10-25 16:21:32.928'),('9e3ce593-deca-430c-8c0e-6194c725f5a5','','2025-07','ទិញសំម្ភារះ',0,'2025-10-25 13:35:02.265'),('a0b9eff0-a975-42fc-88ec-43529f0cfc31','','2025-10','ទិញនំ',5,'2025-10-25 13:57:23.655'),('a693d415-acec-4b19-a547-c38ce6236c1b','','2025-09','ទិញឡេ',0,'2025-10-25 13:30:08.253'),('af73564b-ae1a-4619-8559-5dc7161c9962','b4141e53-0049-4ff6-af94-3b9906595f68','2025-11','Buy food',400,'2025-10-26 17:31:28.627'),('b4bb80f2-57dc-4536-b025-014bee8750b2','','2025-12','បោកខោរអាវ',0,'2025-10-25 17:13:30.571'),('bb01933d-05b8-493a-b6ad-71637c693835','b4141e53-0049-4ff6-af94-3b9906595f68','2025-10','Shopping',0,'2025-10-26 17:29:21.418'),('d59fc2d4-0255-42f0-88b6-6684daf85306','','2025-10','ទិញឡេ',50,'2025-10-25 13:57:33.413'),('f8e942d7-e983-4a27-8549-80ec5811ce49','b4141e53-0049-4ff6-af94-3b9906595f68','2025-07','Shopping',0,'2025-10-26 17:37:37.267');
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spending_entries`
--

DROP TABLE IF EXISTS `spending_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spending_entries` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` double DEFAULT NULL,
  `category` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `date` datetime(3) DEFAULT NULL,
  `note` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(3) DEFAULT NULL,
  `month_key` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_spending_entries_category` (`category`),
  KEY `idx_spending_entries_month_key` (`month_key`),
  KEY `idx_spending_entries_user_id` (`user_id`),
  CONSTRAINT `fk_spending_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spending_entries`
--

LOCK TABLES `spending_entries` WRITE;
/*!40000 ALTER TABLE `spending_entries` DISABLE KEYS */;
INSERT INTO `spending_entries` VALUES ('151f1505-61a1-4cc6-825e-0cca4ad99b1f',10,'ចាក់សាំ','2025-10-14 07:00:00.000','','2025-10-25 13:52:12.803','2025-10',NULL),('1a46478b-8856-427b-bbac-e6429cc10ca0',40,'Buy food','2025-11-05 07:00:00.000','','2025-10-26 17:55:39.440','2025-11','b4141e53-0049-4ff6-af94-3b9906595f68'),('230db4da-d55d-482e-b361-b87d2c463387',10,'Food','2025-10-13 07:00:00.000','','2025-10-25 13:54:40.343','2025-10',NULL),('2ca1aee9-a2f4-4491-86f8-9779df7a99f3',100,'Shopping','2025-10-27 07:00:00.000','','2025-10-26 17:29:37.391','2025-10','b4141e53-0049-4ff6-af94-3b9906595f68'),('435386e1-1e60-4d61-ac49-191f4e5f548b',10,'Shopping','2025-10-25 07:00:00.000','','2025-10-26 17:55:18.862','2025-10','b4141e53-0049-4ff6-af94-3b9906595f68'),('4b1d4e15-3382-4e03-92e7-177d42f342a4',10,'ទិញសំម្ភារះ','2025-10-25 07:00:00.000','','2025-10-25 16:29:48.741','2025-10',NULL),('6598663f-0db3-4635-bebe-28217857fc23',10,'ទិញសំម្ភារះ','2025-10-25 07:00:00.000','','2025-10-25 13:22:02.863','2025-10',NULL),('660b3b8c-f452-4862-bdaf-5bf15ab2af80',10,'ទិញសំម្ភារះ','2025-10-25 07:00:00.000','','2025-10-25 13:46:36.761','2025-10',NULL),('7379fb19-c07b-407a-a0a4-90a7cf1753c6',10,'ចាក់សាំ','2025-11-05 07:00:00.000','','2025-10-25 16:22:27.380','2025-11',NULL),('87225f6c-fd1c-4e90-8852-9b6a127187ad',20,'ទិញឡេ','2025-10-26 07:00:00.000','','2025-10-25 16:34:17.155','2025-10',NULL),('946527e5-a617-40e2-8280-eff584cc8ac4',10,'ទិញឡេ','2025-10-25 07:00:00.000','','2025-10-25 12:45:39.599','2025-10',NULL),('9591204a-9787-46ee-a12f-0af443c0c2be',10,'ទិញនំ','2025-10-24 07:00:00.000','','2025-10-25 13:10:49.645','2025-10',NULL),('9c6b2542-de4d-4f97-a3fe-17166563cd6d',1,'ទិញសំម្ភារះ','2025-10-26 07:00:00.000','','2025-10-25 13:51:09.798','2025-10',NULL),('a1dc0d33-d591-49a2-bf49-4e2ed4322599',15,'ទិញឡេ','2025-10-26 07:00:00.000','','2025-10-25 13:07:17.089','2025-10',NULL),('ad6d434c-74f1-43ed-a32e-493fb0e7a152',5,'បោកខោរអាវ','2025-10-13 07:00:00.000','','2025-10-25 13:56:15.852','2025-10',NULL),('e89ed2db-a3e6-4ed8-8507-f87f85a4088b',10,'Buy food','2025-07-23 07:00:00.000','','2025-10-26 17:56:00.744','2025-07','b4141e53-0049-4ff6-af94-3b9906595f68'),('ef564694-25e6-4d36-8fdb-2e3adaf76e39',20,'ទិញឡេ','2025-10-26 07:00:00.000','','2025-10-25 12:53:28.566','2025-10',NULL);
/*!40000 ALTER TABLE `spending_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password_hash` longtext COLLATE utf8mb4_general_ci,
  `name` longtext COLLATE utf8mb4_general_ci,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('b4141e53-0049-4ff6-af94-3b9906595f68','admin@gmail.com','$2a$10$SzrABxH5oP6WJDTL641JEuKqw7Bi3URvERJqkGRha0LM2mpo/5xKS','Admin','2025-10-26 14:27:02.076',NULL),('b459f7bb-fbe3-4d44-a8f3-21580df0b0b3','vichet@gmail.com','$2a$10$svICciJ1AbAAukAb4Dsfx.eQrd3eeQZapPcuTHQhOgy1yzovrwKZ6','Vichet','2025-10-26 17:32:54.929',NULL),('eca0be1b-c6d0-481d-9732-b0c326ddb4fb','test.user@example.com','$2a$10$NIef32VjRqLNmqTrWxAdS.FJcq/dms6qipWI23fGRtoBBTbHfR0ZS','Test User','2025-10-26 16:44:51.828',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-30 17:36:56
