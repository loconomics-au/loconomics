/*
   viernes, 30 de diciembre de 201610:44:13
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
ALTER TABLE dbo.CalendarReccurrence
	DROP CONSTRAINT FK_CalendarReccursive_CalendarEvents
GO
ALTER TABLE dbo.CalendarEvents SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarReccurrence
	DROP CONSTRAINT FK_CalendarReccurrence_CalendarRecurrenceFrequencyTypes
GO
ALTER TABLE dbo.CalendarRecurrenceFrequencyTypes SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarRecurrenceFrequencyTypes', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarRecurrenceFrequencyTypes', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarRecurrenceFrequencyTypes', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.Tmp_CalendarReccurrence
	(
	ID int NOT NULL IDENTITY (1, 1),
	EventID int NULL,
	Count int NULL,
	EvaluationMode nvarchar(50) NULL,
	Frequency int NULL,
	Interval int NULL,
	RestristionType int NULL,
	Until datetimeoffset(0) NULL,
	FirstDayOfWeek int NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_CalendarReccurrence SET (LOCK_ESCALATION = TABLE)
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarReccurrence ON
GO
IF EXISTS(SELECT * FROM dbo.CalendarReccurrence)
	 EXEC('INSERT INTO dbo.Tmp_CalendarReccurrence (ID, EventID, Count, EvaluationMode, Frequency, Interval, RestristionType, Until, FirstDayOfWeek)
		SELECT ID, EventID, Count, EvaluationMode, Frequency, Interval, RestristionType, CONVERT(datetimeoffset(0), Until), FirstDayOfWeek FROM dbo.CalendarReccurrence WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarReccurrence OFF
GO
ALTER TABLE dbo.CalendarReccurrenceFrequency
	DROP CONSTRAINT FK_CalendarFrecuency_CalendarReccursive
GO
DROP TABLE dbo.CalendarReccurrence
GO
EXECUTE sp_rename N'dbo.Tmp_CalendarReccurrence', N'CalendarReccurrence', 'OBJECT' 
GO
ALTER TABLE dbo.CalendarReccurrence ADD CONSTRAINT
	PK_CalendarReccursive PRIMARY KEY CLUSTERED 
	(
	ID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.CalendarReccurrence ADD CONSTRAINT
	FK_CalendarReccurrence_CalendarRecurrenceFrequencyTypes FOREIGN KEY
	(
	Frequency
	) REFERENCES dbo.CalendarRecurrenceFrequencyTypes
	(
	ID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.CalendarReccurrence ADD CONSTRAINT
	FK_CalendarReccursive_CalendarEvents FOREIGN KEY
	(
	EventID
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarReccurrence', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarReccurrence', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarReccurrence', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarReccurrenceFrequency ADD CONSTRAINT
	FK_CalendarFrecuency_CalendarReccursive FOREIGN KEY
	(
	CalendarReccursiveID
	) REFERENCES dbo.CalendarReccurrence
	(
	ID
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarReccurrenceFrequency SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarReccurrenceFrequency', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarReccurrenceFrequency', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarReccurrenceFrequency', 'Object', 'CONTROL') as Contr_Per 