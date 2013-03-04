/*
   viernes, 22 de febrero de 201318:02:11
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
ALTER TABLE dbo.CalendarRecurrenceFrequencyTypes ADD
	UnitPlural nvarchar(30) NULL
GO
ALTER TABLE dbo.CalendarRecurrenceFrequencyTypes SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarRecurrenceFrequencyTypes', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarRecurrenceFrequencyTypes', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarRecurrenceFrequencyTypes', 'Object', 'CONTROL') as Contr_Per 