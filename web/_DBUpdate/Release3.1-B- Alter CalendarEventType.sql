/*
   viernes, 26 de julio de 201318:27:50
   User: DB_31755_dev_user
   Server: s09.winhost.com
   Database: DB_31755_dev
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
CREATE TABLE dbo.Tmp_CalendarEventType
	(
	EventTypeId int NOT NULL,
	EventType nvarchar(100) NULL,
	Description nvarchar(MAX) NULL,
	DisplayName nvarchar(100) NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_CalendarEventType SET (LOCK_ESCALATION = TABLE)
GO
IF EXISTS(SELECT * FROM dbo.CalendarEventType)
	 EXEC('INSERT INTO dbo.Tmp_CalendarEventType (EventTypeId, EventType, Description, DisplayName)
		SELECT EventTypeId, EventType, Description, DisplayName FROM dbo.CalendarEventType WITH (HOLDLOCK TABLOCKX)')
GO
ALTER TABLE dbo.CalendarEvents
	DROP CONSTRAINT FK_CalendarEvents_CalendarEventType
GO
DROP TABLE dbo.CalendarEventType
GO
EXECUTE sp_rename N'dbo.Tmp_CalendarEventType', N'CalendarEventType', 'OBJECT' 
GO
ALTER TABLE dbo.CalendarEventType ADD CONSTRAINT
	PK_EventType PRIMARY KEY CLUSTERED 
	(
	EventTypeId
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventType', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventType', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventType', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEvents WITH NOCHECK ADD CONSTRAINT
	FK_CalendarEvents_CalendarEventType FOREIGN KEY
	(
	EventType
	) REFERENCES dbo.CalendarEventType
	(
	EventTypeId
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarEvents
	NOCHECK CONSTRAINT FK_CalendarEvents_CalendarEventType
GO
ALTER TABLE dbo.CalendarEvents SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'CONTROL') as Contr_Per 