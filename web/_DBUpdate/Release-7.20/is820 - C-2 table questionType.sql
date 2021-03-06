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
CREATE TABLE dbo.questionType
	(
	questionTypeID int NOT NULL,
	name nvarchar(50) NOT NULL,
	description nvarchar(500) NOT NULL,
	createdDate datetimeoffset(0) NOT NULL,
	updatedDate datetimeoffset(0) NOT NULL,
	modifiedBy nvarchar(10) NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.questionType ADD CONSTRAINT
	PK_questionType PRIMARY KEY CLUSTERED 
	(
	questionTypeID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.questionType SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.questionType', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.questionType', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.questionType', 'Object', 'CONTROL') as Contr_Per 