-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 17, 2026 at 01:36 PM
-- Server version: 10.11.18-MariaDB-cll-lve
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `wawbesbwsa_db_name`
--

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `purchaser_id` int(11) NOT NULL,
  `status` enum('pending','in_inventory','handed','received') NOT NULL DEFAULT 'pending',
  `chief_id` int(11) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `screenshot_path` varchar(255) DEFAULT NULL,
  `handed_at` datetime DEFAULT NULL,
  `size` enum('small','large') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `ingredient_id`, `quantity`, `unit_price`, `total_price`, `purchaser_id`, `status`, `chief_id`, `received_at`, `created_at`, `updated_at`, `approved_by`, `approved_at`, `screenshot_path`, `handed_at`, `size`) VALUES
(43, 6, 166.000, 350.00, 58100.00, 7, 'received', 8, '2026-07-04 09:13:27', '2026-07-02 18:43:58', '2026-07-04 09:13:27', NULL, NULL, '1783017838361-apf3tqx8s06.png', '2026-07-03 15:51:52', NULL),
(44, 6, 65.000, 260.00, 16900.00, 7, 'received', 8, '2026-07-04 09:13:29', '2026-07-02 18:45:30', '2026-07-04 09:13:29', NULL, NULL, '1783017930238-us9mwv2ft4.png', '2026-07-03 15:51:50', NULL),
(45, 7, 10.000, 2300.00, 23000.00, 7, 'received', 8, '2026-07-04 09:13:31', '2026-07-02 18:47:10', '2026-07-04 09:13:31', NULL, NULL, '1783018030864-nwvs0vdxscf.png', '2026-07-03 15:51:48', NULL),
(46, 18, 6.000, 4000.00, 24000.00, 7, 'received', 8, '2026-07-04 09:13:35', '2026-07-02 18:49:26', '2026-07-04 09:13:35', NULL, NULL, '1783018166446-v4x67uxzq9.png', '2026-07-03 15:51:48', NULL),
(47, 18, 6.000, 4000.00, 24000.00, 7, 'received', 8, '2026-07-11 18:48:43', '2026-07-04 17:22:15', '2026-07-11 18:48:43', NULL, NULL, '1783185735539-zmmnxhv3mc.png', '2026-07-06 12:52:26', NULL),
(48, 18, 10.000, 4000.00, 40000.00, 7, 'received', 8, '2026-07-11 18:48:39', '2026-07-04 17:55:12', '2026-07-11 18:48:39', NULL, NULL, '1783187712767-z0g6t6rlq2k.png', '2026-07-06 12:52:23', NULL),
(49, 6, 47.000, 260.00, 12220.00, 7, 'received', 8, '2026-07-11 18:48:45', '2026-07-04 17:58:13', '2026-07-11 18:48:45', NULL, NULL, '1783187893587-xaw8fwluq9n.png', '2026-07-06 12:52:23', NULL),
(50, 22, 8.000, 360.00, 2880.00, 7, 'received', 8, '2026-07-11 18:48:36', '2026-07-04 17:58:40', '2026-07-11 18:48:36', NULL, NULL, '1783187920187-3d0rpbjf1p5.png', '2026-07-06 12:52:23', NULL),
(51, 6, 96.000, 340.00, 32640.00, 7, 'received', 8, '2026-07-11 18:48:29', '2026-07-06 12:53:40', '2026-07-11 18:48:29', NULL, NULL, '1783342420719-bcmdmlnnflu.png', '2026-07-07 18:40:56', NULL),
(52, 6, 47.000, 250.00, 11750.00, 7, 'received', 8, '2026-07-11 18:48:32', '2026-07-06 12:56:06', '2026-07-11 18:48:32', NULL, NULL, '1783342566933-1uzn6glxczhh.png', '2026-07-07 18:40:55', NULL),
(53, 16, 4.000, 2100.00, 8400.00, 7, 'received', 8, '2026-07-11 18:48:13', '2026-07-07 18:40:35', '2026-07-11 18:48:13', NULL, NULL, '1783449635716-vst7nf4tvbl.png', '2026-07-07 18:40:58', NULL),
(54, 6, 240.000, 380.00, 91200.00, 7, 'received', 8, '2026-07-11 18:48:23', '2026-07-10 19:37:07', '2026-07-11 18:48:23', NULL, NULL, '1783712227035-s8ois4d8noi.png', '2026-07-11 18:36:32', NULL),
(55, 6, 204.000, 330.00, 67320.00, 7, 'received', 8, '2026-07-11 18:48:26', '2026-07-11 14:27:45', '2026-07-11 18:48:26', NULL, NULL, '1783780065185-x4htgn5z5h.jpg', '2026-07-11 18:36:30', NULL),
(56, 22, 36.000, 350.00, 12600.00, 7, 'received', 8, '2026-07-11 18:48:19', '2026-07-11 14:31:47', '2026-07-11 18:48:19', NULL, NULL, '1783780307191-rsv9kti4kll.png', '2026-07-11 18:36:31', NULL),
(57, 15, 12.300, 1300.00, 15990.00, 7, 'received', 8, '2026-07-11 18:47:50', '2026-07-11 14:35:48', '2026-07-11 18:47:50', NULL, NULL, '1783780548924-30w30ksvlgc.png', '2026-07-11 18:36:29', NULL),
(58, 6, 96.000, 300.00, 28800.00, 7, 'handed', NULL, NULL, '2026-07-12 14:15:36', '2026-07-14 19:16:06', NULL, NULL, '1783865736319-xwgsbjvc4um.png', '2026-07-14 19:16:06', NULL),
(59, 6, 23.000, 252.00, 5796.00, 7, 'handed', NULL, NULL, '2026-07-14 19:15:47', '2026-07-14 19:16:07', NULL, NULL, '1784056547239-zcnspyuz0x.png', '2026-07-14 19:16:07', NULL),
(60, 17, 150.000, 206.70, 31005.00, 7, 'handed', NULL, NULL, '2026-07-15 15:40:32', '2026-07-16 18:26:38', NULL, NULL, '1784130032625-b17rvhyhre7.png', '2026-07-16 18:26:38', NULL),
(61, 18, 8.000, 4000.00, 32000.00, 7, 'handed', NULL, NULL, '2026-07-16 18:20:05', '2026-07-16 21:38:08', NULL, NULL, '1784226005181-n5aeutpe3uf.png', '2026-07-16 19:22:48', NULL),
(62, 18, 5.000, 4200.00, 21000.00, 7, 'handed', NULL, NULL, '2026-07-16 18:20:29', '2026-07-16 18:26:45', NULL, NULL, '1784226029096-ua96pdvk9t9.png', '2026-07-16 18:26:45', NULL),
(63, 15, 66.750, 1400.00, 93450.00, 7, 'handed', NULL, NULL, '2026-07-16 18:22:54', '2026-07-16 18:26:44', NULL, NULL, '1784226174479-ft7p8lrssow.jpg', '2026-07-16 18:26:44', NULL),
(64, 6, 180.000, 330.00, 59400.00, 7, 'handed', NULL, NULL, '2026-07-16 18:23:22', '2026-07-16 21:38:53', NULL, NULL, '1784226202409-cjm1j6pk494.jpg', '2026-07-16 18:26:41', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `purchaser_id` (`purchaser_id`),
  ADD KEY `chief_id` (`chief_id`),
  ADD KEY `purchases_approved_by_foreign_idx` (`approved_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_approved_by_foreign_idx` FOREIGN KEY (`approved_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`purchaser_id`) REFERENCES `admins` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_3` FOREIGN KEY (`chief_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
