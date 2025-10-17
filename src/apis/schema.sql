-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 17-10-2025 a las 03:28:44
-- Versión del servidor: 10.11.11-MariaDB-ubu2204
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `vps4_infantiles_valesanito_planilla`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `audit_log`
--

CREATE TABLE `audit_log` (
  `id` varchar(255) NOT NULL,
  `planilla_id` int(11) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `action` enum('jugador_added','jugador_deleted','jugador_updated','persona_added','persona_deleted','persona_updated','status_changed','planilla_created','planilla_updated','planilla_deleted') NOT NULL,
  `entity_type` enum('jugador','persona','planilla') DEFAULT NULL,
  `entity_id` varchar(255) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `username` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `audit_log`
--

INSERT INTO `audit_log` (`id`, `planilla_id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `created_at`, `username`) VALUES
('14014969-a891-11f0-a1a6-fa163ea0f162', 5, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '5', '{\"old_status\":\"Pendiente de aprobación\",\"new_status\":\"Pendiente de envío\"}', '2025-10-14 00:02:30', 'facundo'),
('1c0edf67-a891-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '3', '{\"old_status\":\"Pendiente de envío\",\"new_status\":\"Pendiente de aprobación\"}', '2025-10-14 00:02:44', 'facundo'),
('1f1fcfd6-a891-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '3', '{\"old_status\":\"Pendiente de aprobación\",\"new_status\":\"Aprobada\"}', '2025-10-14 00:02:49', 'facundo'),
('295fafce-a88d-11f0-a1a6-fa163ea0f162', 5, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'jugador_added', 'jugador', '295eb1f0-a88d-11f0-a1a6-fa163ea0f162', '{\"planilla_id\":5,\"dni\":\"42703972\",\"number\":1,\"name\":\"Dibu\",\"second_name\":\"Martinez\"}', '2025-10-13 23:34:28', 'facundo'),
('5cba16f3-a891-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '3', '{\"old_status\":\"Aprobada\",\"new_status\":\"Pendiente de envío\"}', '2025-10-14 00:04:32', 'facundo'),
('5fd5bd80-a891-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '3', '{\"old_status\":\"Pendiente de envío\",\"new_status\":\"Pendiente de aprobación\"}', '2025-10-14 00:04:38', 'facundo'),
('62b06999-a891-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '3', '{\"old_status\":\"Pendiente de aprobación\",\"new_status\":\"Aprobada\"}', '2025-10-14 00:04:42', 'facundo'),
('75a57b0d-a88c-11f0-a1a6-fa163ea0f162', 5, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'planilla_created', 'planilla', '5', '{\"team_id\":\"team_68eb29a92c48f6.63522297\",\"user_ids\":[\"32522d4c-c2ce-44af-a176-c23a5e980c16\",\"79eb4026-f730-4ccc-bd87-d0769e3ba45e\"],\"status\":\"Pendiente de envío\"}', '2025-10-13 23:29:27', 'facundo'),
('acc9824d-a890-11f0-a1a6-fa163ea0f162', 5, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '5', '{\"old_status\":\"Pendiente de envío\",\"new_status\":\"Pendiente de aprobación\"}', '2025-10-13 23:59:37', 'facundo'),
('b07d26fa-ab06-11f0-a1a6-fa163ea0f162', 6, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'planilla_created', 'planilla', '6', '{\"team_id\":\"team_68eda008940568.82851623\",\"user_id\":\"113a1f2852226867bfac1d18c7ace23a\",\"bulk_create\":true}', '2025-10-17 03:09:26', 'facundo'),
('b0d2c30e-ab06-11f0-a1a6-fa163ea0f162', 7, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'planilla_created', 'planilla', '7', '{\"team_id\":\"team_68eda008941120.05618129\",\"user_id\":\"8dc792303a2a4dc578458b84c7ed9188\",\"bulk_create\":true}', '2025-10-17 03:09:27', 'facundo'),
('b0d9f5cb-ab06-11f0-a1a6-fa163ea0f162', 8, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'planilla_created', 'planilla', '8', '{\"team_id\":\"team_68eda008941439.32200020\",\"user_id\":\"4240f2aa92fe2e0e39b46583c38c576e\",\"bulk_create\":true}', '2025-10-17 03:09:27', 'facundo'),
('d98642c5-a889-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'jugador_added', 'jugador', 'd961a61b-a889-11f0-a1a6-fa163ea0f162', '{\"planilla_id\":3,\"dni\":\"123\",\"number\":1,\"name\":\"Emiliano\",\"second_name\":\"Martinez\"}', '2025-10-13 23:10:46', 'facundo'),
('e96c00ce-a889-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'jugador_deleted', 'jugador', 'd961a61b-a889-11f0-a1a6-fa163ea0f162', '{\"id\":\"d961a61b-a889-11f0-a1a6-fa163ea0f162\",\"planilla_id\":3,\"dni\":\"123\",\"number\":1,\"name\":\"Emiliano\",\"second_name\":\"Martinez\",\"created_at\":\"2025-10-13 20:10:45\"}', '2025-10-13 23:11:12', 'facundo'),
('ed783406-a889-11f0-a1a6-fa163ea0f162', 3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'jugador_deleted', 'jugador', '75e5211a-a889-11f0-a1a6-fa163ea0f162', '{\"id\":\"75e5211a-a889-11f0-a1a6-fa163ea0f162\",\"planilla_id\":3,\"dni\":\"123\",\"number\":1,\"name\":\"Emiliano\",\"second_name\":\"Martinez\",\"created_at\":\"2025-10-13 20:07:59\"}', '2025-10-13 23:11:19', 'facundo'),
('f16e85d3-a88d-11f0-a1a6-fa163ea0f162', 5, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '5', '{\"old_status\":\"Pendiente de envío\",\"new_status\":\"Pendiente de aprobación\"}', '2025-10-13 23:40:04', 'facundo'),
('fddc9c6d-a88d-11f0-a1a6-fa163ea0f162', 5, '32522d4c-c2ce-44af-a176-c23a5e980c16', 'status_changed', 'planilla', '5', '{\"old_status\":\"Pendiente de aprobación\",\"new_status\":\"Pendiente de envío\"}', '2025-10-13 23:40:25', 'facundo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jugadores`
--

CREATE TABLE `jugadores` (
  `id` varchar(255) NOT NULL,
  `planilla_id` int(11) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `number` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `second_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `jugadores`
--

INSERT INTO `jugadores` (`id`, `planilla_id`, `dni`, `number`, `name`, `second_name`, `created_at`) VALUES
('295eb1f0-a88d-11f0-a1a6-fa163ea0f162', 5, '42703972', 1, 'Dibu', 'Martinez', '2025-10-13 23:34:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id` varchar(255) NOT NULL,
  `planilla_id` int(11) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `second_name` varchar(255) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `charge` enum('Técnico','Delegado','Médico') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planillas`
--

CREATE TABLE `planillas` (
  `id` int(11) NOT NULL,
  `team_id` varchar(255) NOT NULL,
  `status` enum('Pendiente de envío','Pendiente de aprobación','Aprobada') DEFAULT 'Pendiente de envío',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `planillas`
--

INSERT INTO `planillas` (`id`, `team_id`, `status`, `created_at`, `updated_at`) VALUES
(3, 'team_68eb29a92c48f6.63522297', 'Aprobada', '2025-10-12 04:31:54', '2025-10-14 00:04:42'),
(5, 'team_68eb29a92c48f6.63522297', 'Pendiente de envío', '2025-10-13 23:29:27', '2025-10-14 00:02:30'),
(6, 'team_68eda008940568.82851623', 'Pendiente de envío', '2025-10-17 03:09:26', '2025-10-17 03:09:26'),
(7, 'team_68eda008941120.05618129', 'Pendiente de envío', '2025-10-17 03:09:27', '2025-10-17 03:09:27'),
(8, 'team_68eda008941439.32200020', 'Pendiente de envío', '2025-10-17 03:09:27', '2025-10-17 03:09:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profiles`
--

CREATE TABLE `profiles` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `profiles`
--

INSERT INTO `profiles` (`id`, `username`, `email`, `password`, `is_admin`, `created_at`) VALUES
('113a1f2852226867bfac1d18c7ace23a', 'teamcsv2', 'teamcsv2@valesanito', '$2y$10$NUnZPEumg/KgU.Je4tk4ye5Pzj/NfecDNi3zMWNOmJpzSHl2fPGxa', 0, '2025-10-17 03:09:26'),
('32522d4c-c2ce-44af-a176-c23a5e980c16', 'facundo', 'facundo@valesanito.com', '$2y$10$Ch3agQ38t7SJtW/rOPhBqeEXvlNpRfBEAm9./h52ubI9mAB1TE6yi', 1, '2025-10-12 04:07:14'),
('4240f2aa92fe2e0e39b46583c38c576e', 'teamcsv4', 'teamcsv4@valesanito', '$2y$10$WHCiha/czaeBcvLTu54QFu37yMwtrhmIn86cLIKRX15szC30Pgmby', 0, '2025-10-17 03:09:27'),
('4471eb850994a6efb58861d0b174702c', 'withoutsupa', 'withoutsupa@valesanito.com', '$2y$10$MNuGn9LQS3QSmnHXK2w2he/4QFTPzPaNHm8V3hLooVh3ZFAymLnne', 0, '2025-10-17 02:23:12'),
('79eb4026-f730-4ccc-bd87-d0769e3ba45e', 'alma', 'alma@valesanito.com', '$2y$10$Ch3agQ38t7SJtW/rOPhBqeEXvlNpRfBEAm9./h52ubI9mAB1TE6yi', 0, '2025-10-12 04:30:08'),
('8dc792303a2a4dc578458b84c7ed9188', 'teamcsv3', 'teamcsv3@valesanito', '$2y$10$rvL3lA.GJmDSRePNs38pJO6BenvNX64fq8S933G60Ute/TAvHeOJm', 0, '2025-10-17 03:09:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `session_token`, `expires_at`, `created_at`) VALUES
('40052dd0e378308dc32b880fa61d19da', '32522d4c-c2ce-44af-a176-c23a5e980c16', '1a3bcb8e492fa800d96a8a3750fef4662486f446fe1dfa0afb144814720522e9', '2025-10-24 06:08:10', '2025-10-17 03:08:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `teams`
--

CREATE TABLE `teams` (
  `id` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `shortname` varchar(50) DEFAULT NULL,
  `category` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `teams`
--

INSERT INTO `teams` (`id`, `nombre`, `shortname`, `category`, `created_at`) VALUES
('team_68eb29a92c48f6.63522297', 'Equipo 1', 'equipo1', 2010, '2025-10-12 04:08:09'),
('team_68eda008940568.82851623', 'Team csv 2', 'teamcsv2', 2010, '2025-10-14 00:57:44'),
('team_68eda008941120.05618129', 'Team csv 3', 'teamcsv3', 2010, '2025-10-14 00:57:44'),
('team_68eda008941439.32200020', 'Team csv 4', 'teamcsv4', 2011, '2025-10-14 00:57:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_planilla`
--

CREATE TABLE `user_planilla` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `planilla_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_planilla`
--

INSERT INTO `user_planilla` (`id`, `user_id`, `planilla_id`, `created_at`) VALUES
(2, '79eb4026-f730-4ccc-bd87-d0769e3ba45e', 3, '2025-10-12 04:31:54'),
(3, '32522d4c-c2ce-44af-a176-c23a5e980c16', 3, '2025-10-12 04:31:54'),
(6, '32522d4c-c2ce-44af-a176-c23a5e980c16', 5, '2025-10-13 23:29:27'),
(7, '79eb4026-f730-4ccc-bd87-d0769e3ba45e', 5, '2025-10-13 23:29:27'),
(8, '113a1f2852226867bfac1d18c7ace23a', 6, '2025-10-17 03:09:26'),
(9, '8dc792303a2a4dc578458b84c7ed9188', 7, '2025-10-17 03:09:27'),
(10, '4240f2aa92fe2e0e39b46583c38c576e', 8, '2025-10-17 03:09:27');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `planilla_id` (`planilla_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `jugadores`
--
ALTER TABLE `jugadores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `planilla_id` (`planilla_id`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `planilla_id` (`planilla_id`);

--
-- Indices de la tabla `planillas`
--
ALTER TABLE `planillas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `team_id` (`team_id`);

--
-- Indices de la tabla `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `idx_session_token` (`session_token`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indices de la tabla `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shortname` (`shortname`),
  ADD UNIQUE KEY `idx_teams_shortname` (`shortname`);

--
-- Indices de la tabla `user_planilla`
--
ALTER TABLE `user_planilla`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `planilla_id` (`planilla_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `planillas`
--
ALTER TABLE `planillas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `user_planilla`
--
ALTER TABLE `user_planilla`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `jugadores`
--
ALTER TABLE `jugadores`
  ADD CONSTRAINT `jugadores_ibfk_1` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `personas`
--
ALTER TABLE `personas`
  ADD CONSTRAINT `personas_ibfk_1` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `planillas`
--
ALTER TABLE `planillas`
  ADD CONSTRAINT `planillas_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_planilla`
--
ALTER TABLE `user_planilla`
  ADD CONSTRAINT `user_planilla_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_planilla_ibfk_2` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;