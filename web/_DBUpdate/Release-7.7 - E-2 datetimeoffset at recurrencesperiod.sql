/*
   viernes, 30 de diciembre de 201610:41:57
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
ALTER TABLE dbo.CalendarEventRecurrencesPeriod
	DROP CONSTRAINT FK_CalendarEventRecurrencesPeriod_CalendarEventRecurrencesPeriodList
GO
ALTER TABLE dbo.CalendarEventRecurrencesPeriodList SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriodList', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriodList', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriodList', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.Tmp_CalendarEventRecurrencesPeriod
	(
	IdRecurrence int NOT NULL,
	DateStart datetimeoffset(0) NOT NULL,
	DateEnd datetimeoffset(0) NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_CalendarEventRecurrencesPeriod SET (LOCK_ESCALATION = TABLE)
GO
IF EXISTS(SELECT * FROM dbo.CalendarEventRecurrencesPeriod)
	 EXEC('INSERT INTO dbo.Tmp_CalendarEventRecurrencesPeriod (IdRecurrence, DateStart, DateEnd)
		SELECT IdRecurrence, CONVERT(datetimeoffset(0), DateStart), CONVERT(datetimeoffset(0), DateEnd) FROM dbo.CalendarEventRecurrencesPeriod WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.CalendarEventRecurrencesPeriod
GO
EXECUTE sp_rename N'dbo.Tmp_CalendarEventRecurrencesPeriod', N'CalendarEventRecurrencesPeriod', 'OBJECT' 
GO
ALTER TABLE dbo.CalendarEventRecurrencesPeriod ADD CONSTRAINT
	PK_CalendarEventRecurrencesPeriod_1 PRIMARY KEY CLUSTERED 
	(
	IdRecurrence,
	DateStart
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.CalendarEventRecurrencesPeriod ADD CONSTRAINT
	FK_CalendarEventRecurrencesPeriod_CalendarEventRecurrencesPeriodList FOREIGN KEY
	(
	IdRecurrence
	) REFERENCES dbo.CalendarEventRecurrencesPeriodList
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriod', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriod', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriod', 'Object', 'CONTROL') as Contr_Per 