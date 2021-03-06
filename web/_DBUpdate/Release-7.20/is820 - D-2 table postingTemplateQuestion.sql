/*
   martes, 29 de mayo de 201813:58:27
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
ALTER TABLE dbo.question SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.question', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.question', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.question', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.postingTemplate SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.postingTemplate', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.postingTemplate', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.postingTemplate', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.postingTemplateQuestion
	(
	postingTemplateQuestionID int NOT NULL IDENTITY (1, 1),
	postingTemplateID int NOT NULL,
	questionID int NOT NULL,
	legend nvarchar(150) NOT NULL,
	branchLogic text NULL,
	createdDate datetimeoffset(0) NOT NULL,
	updatedDate datetimeoffset(0) NOT NULL,
	modifiedby nchar(5) NOT NULL,
	active tinyint NOT NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.postingTemplateQuestion ADD CONSTRAINT
	PK_postingTemplateQuestion PRIMARY KEY CLUSTERED 
	(
	postingTemplateQuestionID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.postingTemplateQuestion ADD CONSTRAINT
	FK_postingTemplateQuestion_postingTemplate FOREIGN KEY
	(
	postingTemplateID
	) REFERENCES dbo.postingTemplate
	(
	postingTemplateID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.postingTemplateQuestion ADD CONSTRAINT
	FK_postingTemplateQuestion_question FOREIGN KEY
	(
	questionID
	) REFERENCES dbo.question
	(
	questionID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.postingTemplateQuestion SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.postingTemplateQuestion', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.postingTemplateQuestion', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.postingTemplateQuestion', 'Object', 'CONTROL') as Contr_Per 