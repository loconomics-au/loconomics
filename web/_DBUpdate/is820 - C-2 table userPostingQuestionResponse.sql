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
CREATE TABLE dbo.UserPostingQuestionResponse
	(
	userPostingID int NOT NULL,
	questionID int NOT NULL,
	responses text NOT NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.UserPostingQuestionResponse ADD CONSTRAINT
	PK_UserPostingQuestionResponse PRIMARY KEY CLUSTERED 
	(
	userPostingID,
	questionID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE dbo.UserPostingQuestionResponse ADD CONSTRAINT
	FK_UserPostingQuestionResponse_UserPosting FOREIGN KEY
	(
	userPostingID
	) REFERENCES dbo.UserPosting
	(
	userPostingID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
GO
ALTER TABLE dbo.UserPostingQuestionResponse SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserPostingQuestionResponse', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserPostingQuestionResponse', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserPostingQuestionResponse', 'Object', 'CONTROL') as Contr_Per 