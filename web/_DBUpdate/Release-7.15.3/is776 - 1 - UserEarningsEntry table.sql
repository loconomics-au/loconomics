/*
   domingo, 11 de febrero de 201819:40:41
   User: 
   Server: ESTUDIO-I3\SQLEXPRESS
   Database: loconomics
   Application: 
*/

/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.ServiceProfessionalClient SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserExternalListing SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.users SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.users', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.UserEarningsEntry
	(
	UserID int NOT NULL,
	EarningsEntryID int NOT NULL,
	PaidDate datetimeoffset(7) NOT NULL,
	DurationMinutes int NOT NULL,
	UserExternalListingID int NOT NULL,
	JobTitleID int NOT NULL,
	ClientUserID int NOT NULL,
	Notes text NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	PK_UserEarningsEntry PRIMARY KEY CLUSTERED 
	(
	UserID,
	EarningsEntryID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_UserExternalListing FOREIGN KEY
	(
	UserExternalListingID
	) REFERENCES dbo.UserExternalListing
	(
	UserExternalListingID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_ServiceProfessionalClient FOREIGN KEY
	(
	UserID,
	ClientUserID
	) REFERENCES dbo.ServiceProfessionalClient
	(
	ServiceProfessionalUserID,
	ClientUserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarningsEntry SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'CONTROL') as Contr_Per 