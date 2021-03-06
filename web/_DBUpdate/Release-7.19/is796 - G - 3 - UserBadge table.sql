CREATE TABLE dbo.UserBadge (
UserBadgeID int NOT NULL IDENTITY (1, 1),
UserID int NOT NULL,
SolutionID int NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
BadgeURL nvarchar(255) NOT NULL,
Type nvarchar(20) NOT NULL,
Category nvarchar(50) NOT NULL,
ExpiryDate datetimeoffset(0) NULL,
CreatedDate datetimeoffset(0) NOT NULL,
UpdatedDate datetimeoffset(0) NOT NULL,
CreatedBy nvarchar(4) NOT NULL,
ModifiedBy nvarchar(4) NOT NULL,
Active bit NOT NULL DEFAULT 1,
CONSTRAINT
	PK_UserBadge PRIMARY KEY
	(
	UserBadgeID
	),
CONSTRAINT
	FK_UserBadge_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION,
CONSTRAINT
	FK_UserBadge_UserBadge FOREIGN KEY
	(
	UserBadgeID
	) REFERENCES dbo.UserBadge
	(
	UserBadgeID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION,
CONSTRAINT
	FK_UserBadge_Solution FOREIGN KEY
	(
	SolutionID,
	LanguageID,
	CountryID
	) REFERENCES dbo.Solution
	(
	SolutionID,
	LanguageID,
	CountryID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION,
)
;
DECLARE @v sql_variant 
SET @v = N'Special value ''user'' means createdy by the userID'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'UserBadge', N'COLUMN', N'CreatedBy'
