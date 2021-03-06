/*
   lunes, 08 de mayo de 201713:53:00
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
CREATE TABLE dbo.Tmp_UserFeePayments
	(
	UserFeePaymentID int NOT NULL IDENTITY (1, 1),
	UserID int NOT NULL,
	PaymentTransactionID varchar(250) NOT NULL,
	SubscriptionID varchar(250) NOT NULL,
	PaymentDate datetimeoffset(0) NOT NULL,
	PaymentAmount money NOT NULL,
	PaymentPlan varchar(25) NOT NULL,
	PaymentMethod varchar(50) NOT NULL,
	PaymentStatus varchar(50) NOT NULL,
	CreatedDate datetimeoffset(0) NOT NULL,
	ModifiedDate datetimeoffset(0) NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_UserFeePayments SET (LOCK_ESCALATION = TABLE)
GO
SET IDENTITY_INSERT dbo.Tmp_UserFeePayments OFF
GO
IF EXISTS(SELECT * FROM dbo.UserFeePayments)
	 EXEC('INSERT INTO dbo.Tmp_UserFeePayments (UserID, PaymentTransactionID, PaymentDate, PaymentAmount, PaymentPlan, PaymentMethod, PaymentStatus, CreatedDate, ModifiedDate)
		SELECT UserID, PaymentTransactionID, PaymentDate, PaymentAmount, PaymentPlan, PaymentMethod, PaymentStatus, CreatedDate, ModifiedDate FROM dbo.UserFeePayments WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.UserFeePayments
GO
EXECUTE sp_rename N'dbo.Tmp_UserFeePayments', N'UserFeePayments', 'OBJECT' 
GO
ALTER TABLE dbo.UserFeePayments ADD CONSTRAINT
	PK__UserFeeP__1788CCAC0347582D PRIMARY KEY CLUSTERED 
	(
	UserFeePaymentID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserFeePayments', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserFeePayments', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserFeePayments', 'Object', 'CONTROL') as Contr_Per 