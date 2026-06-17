-- RadarSec v2 Migration
-- Drops old tables and recreates with new schema for a clean start

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `Evidence`;
DROP TABLE IF EXISTS `Incident`;
DROP TABLE IF EXISTS `Project`;
DROP TABLE IF EXISTS `User`;

SET FOREIGN_KEY_CHECKS = 1;

-- CreateTable User
CREATE TABLE `User` (
    `id`        VARCHAR(191) NOT NULL,
    `email`     VARCHAR(100) NOT NULL,
    `fullname`  VARCHAR(100) NOT NULL,
    `password`  CHAR(60)     NOT NULL,
    `role`      VARCHAR(20)  NOT NULL DEFAULT 'user',
    `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)  NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Project
CREATE TABLE `Project` (
    `id`          VARCHAR(191) NOT NULL,
    `name`        VARCHAR(100) NOT NULL,
    `description` TEXT         NOT NULL,
    `ownerId`     VARCHAR(191) NOT NULL,
    `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3)  NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Incident
CREATE TABLE `Incident` (
    `id`            VARCHAR(191) NOT NULL,
    `projectId`     VARCHAR(191) NOT NULL,
    `userId`        VARCHAR(191) NOT NULL,
    `responsibleId` VARCHAR(191) NULL,
    `title`         VARCHAR(100) NOT NULL,
    `description`   TEXT         NOT NULL,
    `category`      VARCHAR(50)  NOT NULL,
    `severity`      VARCHAR(20)  NOT NULL DEFAULT 'baixa',
    `status`        VARCHAR(20)  NOT NULL DEFAULT 'aberto',
    `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`     DATETIME(3)  NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Evidence
CREATE TABLE `Evidence` (
    `id`           VARCHAR(191) NOT NULL,
    `incidentId`   VARCHAR(191) NOT NULL,
    `filename`     VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimetype`     VARCHAR(100) NOT NULL,
    `size`         INT          NOT NULL,
    `uploadedBy`   VARCHAR(191) NOT NULL,
    `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey Project -> User
ALTER TABLE `Project`
    ADD CONSTRAINT `Project_ownerId_fkey`
    FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Incident -> Project
ALTER TABLE `Incident`
    ADD CONSTRAINT `Incident_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Incident -> User (creator)
ALTER TABLE `Incident`
    ADD CONSTRAINT `Incident_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Incident -> User (responsible)
ALTER TABLE `Incident`
    ADD CONSTRAINT `Incident_responsibleId_fkey`
    FOREIGN KEY (`responsibleId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Evidence -> Incident
ALTER TABLE `Evidence`
    ADD CONSTRAINT `Evidence_incidentId_fkey`
    FOREIGN KEY (`incidentId`) REFERENCES `Incident`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
