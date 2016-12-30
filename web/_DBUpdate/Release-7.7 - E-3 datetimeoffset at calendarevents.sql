/*
   viernes, 30 de diciembre de 201610:43:14
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
ALTER TABLE dbo.CalendarEvents
	DROP CONSTRAINT FK_CalendarEvents_CalendarAvailabilityType
GO
ALTER TABLE dbo.CalendarAvailabilityType SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarAvailabilityType', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarAvailabilityType', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarAvailabilityType', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEvents
	DROP CONSTRAINT FK_CalendarEvents_CalendarEventType
GO
ALTER TABLE dbo.CalendarEventType SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventType', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventType', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventType', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEvents
	DROP CONSTRAINT DF_CalendarEvents_EventType
GO
ALTER TABLE dbo.CalendarEvents
	DROP CONSTRAINT DF_CalendarEvents_Transparency
GO
ALTER TABLE dbo.CalendarEvents
	DROP CONSTRAINT DF_CalendarEvents_IsAllDay
GO
CREATE TABLE dbo.Tmp_CalendarEvents
	(
	Id int NOT NULL IDENTITY (1, 1),
	UserId int NOT NULL,
	EventType int NOT NULL,
	Summary varchar(500) NULL,
	StarTtime datetimeoffset(0) NULL,
	EndTime datetimeoffset(0) NULL,
	UID varchar(150) NULL,
	CalendarAvailabilityTypeID int NOT NULL,
	Transparency bit NOT NULL,
	IsAllDay bit NOT NULL,
	StampTime datetimeoffset(0) NULL,
	TimeZone nvarchar(100) NULL,
	Priority int NULL,
	Location nvarchar(100) NULL,
	UpdatedDate datetimeoffset(0) NULL,
	CreatedDate datetimeoffset(0) NULL,
	ModifyBy nvarchar(50) NULL,
	Class nvarchar(50) NULL,
	Organizer nvarchar(MAX) NULL,
	Sequence int NULL,
	Geo nvarchar(100) NULL,
	RecurrenceId datetimeoffset(0) NULL,
	TimeBlock time(7) NULL,
	DayofWeek int NULL,
	Description nvarchar(MAX) NULL,
	Deleted datetimeoffset(0) NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_CalendarEvents SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_CalendarEvents ADD CONSTRAINT
	DF_CalendarEvents_EventType DEFAULT ((1)) FOR EventType
GO
ALTER TABLE dbo.Tmp_CalendarEvents ADD CONSTRAINT
	DF_CalendarEvents_Transparency DEFAULT ((0)) FOR Transparency
GO
ALTER TABLE dbo.Tmp_CalendarEvents ADD CONSTRAINT
	DF_CalendarEvents_IsAllDay DEFAULT ((0)) FOR IsAllDay
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarEvents ON
GO
IF EXISTS(SELECT * FROM dbo.CalendarEvents)
	 EXEC('INSERT INTO dbo.Tmp_CalendarEvents (Id, UserId, EventType, Summary, StarTtime, EndTime, UID, CalendarAvailabilityTypeID, Transparency, IsAllDay, StampTime, TimeZone, Priority, Location, UpdatedDate, CreatedDate, ModifyBy, Class, Organizer, Sequence, Geo, RecurrenceId, TimeBlock, DayofWeek, Description, Deleted)
		SELECT Id, UserId, EventType, Summary, StarTtime, EndTime, UID, CalendarAvailabilityTypeID, Transparency, IsAllDay, CONVERT(datetimeoffset(0), StampTime), TimeZone, Priority, Location, CONVERT(datetimeoffset(0), UpdatedDate), CONVERT(datetimeoffset(0), CreatedDate), ModifyBy, Class, Organizer, Sequence, Geo, RecurrenceId, TimeBlock, DayofWeek, Description, CONVERT(datetimeoffset(0), Deleted) FROM dbo.CalendarEvents WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarEvents OFF
GO
ALTER TABLE dbo.CalendarReccurrence
	DROP CONSTRAINT FK_CalendarReccursive_CalendarEvents
GO
ALTER TABLE dbo.CalendarEventsContacts
	DROP CONSTRAINT FK_CalendarEventsContacts_CalendarEvents
GO
ALTER TABLE dbo.CalendarEventRecurrencesPeriodList
	DROP CONSTRAINT FK_CalendarEventRecurrencesPeriodList_CalendarEvents
GO
ALTER TABLE dbo.CalendarEventExceptionsPeriodsList
	DROP CONSTRAINT FK_CalendarEventExceptions_CalendarEvents
GO
ALTER TABLE dbo.CalendarEventComments
	DROP CONSTRAINT FK_Comments_CalendarEvents
GO
ALTER TABLE dbo.booking
	DROP CONSTRAINT FK__booking__serviceDate
GO
ALTER TABLE dbo.booking
	DROP CONSTRAINT FK__booking__alternativeDate1
GO
ALTER TABLE dbo.booking
	DROP CONSTRAINT FK__booking__alternativeDate2
GO
ALTER TABLE dbo.CalendarEventsAttendees
	DROP CONSTRAINT FK_CalendarEventsAttendees_CalendarEvents
GO
DROP TABLE dbo.CalendarEvents
GO
EXECUTE sp_rename N'dbo.Tmp_CalendarEvents', N'CalendarEvents', 'OBJECT' 
GO
ALTER TABLE dbo.CalendarEvents ADD CONSTRAINT
	PK_CalendarEvents PRIMARY KEY CLUSTERED 
	(
	Id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.CalendarEvents ADD CONSTRAINT
	FK_CalendarEvents_CalendarEventType FOREIGN KEY
	(
	EventType
	) REFERENCES dbo.CalendarEventType
	(
	EventTypeId
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarEvents ADD CONSTRAINT
	FK_CalendarEvents_CalendarAvailabilityType FOREIGN KEY
	(
	CalendarAvailabilityTypeID
	) REFERENCES dbo.CalendarAvailabilityType
	(
	CalendarAvailabilityTypeID
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
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
ALTER TABLE dbo.CalendarEventsAttendees SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventsAttendees', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventsAttendees', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventsAttendees', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.booking ADD CONSTRAINT
	FK__booking__serviceDate FOREIGN KEY
	(
	ServiceDateID
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.booking ADD CONSTRAINT
	FK__booking__alternativeDate1 FOREIGN KEY
	(
	AlternativeDate1ID
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.booking ADD CONSTRAINT
	FK__booking__alternativeDate2 FOREIGN KEY
	(
	AlternativeDate2ID
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.booking SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.booking', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.booking', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.booking', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEventComments ADD CONSTRAINT
	FK_Comments_CalendarEvents FOREIGN KEY
	(
	IdEvent
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarEventComments SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventComments', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventComments', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventComments', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEventExceptionsPeriodsList ADD CONSTRAINT
	FK_CalendarEventExceptions_CalendarEvents FOREIGN KEY
	(
	IdEvent
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarEventExceptionsPeriodsList SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventExceptionsPeriodsList', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventExceptionsPeriodsList', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventExceptionsPeriodsList', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEventRecurrencesPeriodList ADD CONSTRAINT
	FK_CalendarEventRecurrencesPeriodList_CalendarEvents FOREIGN KEY
	(
	IdEvent
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarEventRecurrencesPeriodList SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriodList', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriodList', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventRecurrencesPeriodList', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarEventsContacts ADD CONSTRAINT
	FK_CalendarEventsContacts_CalendarEvents FOREIGN KEY
	(
	IdEvent
	) REFERENCES dbo.CalendarEvents
	(
	Id
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarEventsContacts SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEventsContacts', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEventsContacts', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEventsContacts', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
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
ALTER TABLE dbo.CalendarReccurrence SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarReccurrence', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarReccurrence', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarReccurrence', 'Object', 'CONTROL') as Contr_Per 