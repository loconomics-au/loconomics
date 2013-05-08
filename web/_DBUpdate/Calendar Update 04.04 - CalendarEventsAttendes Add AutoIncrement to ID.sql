/*
   miércoles, 08 de mayo de 201316:30:23
   User: 
   Server: localhost\SQLEXPRESS
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
ALTER TABLE dbo.CalendarEventsAttendees
	DROP CONSTRAINT FK_CalendarEventsAttendees_CalendarEvents
GO
ALTER TABLE dbo.CalendarEvents SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.Tmp_CalendarEventsAttendees
	(
	Id int NOT NULL IDENTITY (1, 1),
	IdEvent int NOT NULL,
	Attendee nvarchar(MAX) NULL,
	Role nvarchar(50) NULL,
	Uri nvarchar(200) NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_CalendarEventsAttendees SET (LOCK_ESCALATION = TABLE)
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarEventsAttendees ON
GO
IF EXISTS(SELECT * FROM dbo.CalendarEventsAttendees)
	 EXEC('INSERT INTO dbo.Tmp_CalendarEventsAttendees (Id, IdEvent, Attendee, Role, Uri)
		SELECT Id, IdEvent, Attendee, Role, Uri FROM dbo.CalendarEventsAttendees WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarEventsAttendees OFF
GO
DROP TABLE dbo.CalendarEventsAttendees
GO
EXECUTE sp_rename N'dbo.Tmp_CalendarEventsAttendees', N'CalendarEventsAttendees', 'OBJECT' 
GO
ALTER TABLE dbo.CalendarEventsAttendees ADD CONSTRAINT
	PK_CalendarEventsAttendees PRIMARY KEY CLUSTERED 
	(
	Id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.CalendarEventsAttendees ADD CONSTRAINT
	FK_CalendarEventsAttendees_CalendarEvents FOREIGN KEY
	(
	IdEvent
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventsAttendees', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventsAttendees', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventsAttendees', 'Object', 'CONTROL') as Contr_Per 